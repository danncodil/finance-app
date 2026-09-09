use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    categories::model::{CategoryDto, CategoryProfileParams, CreateCategoryDto, UpdateCategoryDto},
    errors::{ApiError, ApiResult},
    transactions::model::ProfileType,
    AppState,
};

/// GET /api/v1/categories
/// Lista todas as categorias vinculadas ao usuário logado.
pub async fn list(
    user: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<CategoryProfileParams>,
) -> ApiResult<Json<Vec<CategoryDto>>> {
    let profile_type = params.profile_type.unwrap_or(ProfileType::Personal);
    let categories = sqlx::query_as::<_, CategoryDto>(
        "SELECT id, name, type, color, icon, profile_type, created_at, updated_at
         FROM categories WHERE user_id = $1 AND profile_type = $2 AND is_active = true ORDER BY name ASC",
    )
    .bind(user.id)
    .bind(profile_type)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(categories))
}

/// POST /api/v1/categories
/// Cria uma nova categoria para o usuário logado.
pub async fn create(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateCategoryDto>,
) -> ApiResult<(StatusCode, Json<CategoryDto>)> {
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    let profile_type = payload.profile_type.unwrap_or(ProfileType::Personal);
    let category = sqlx::query_as::<_, CategoryDto>(
        "INSERT INTO categories (user_id, name, type, color, icon, profile_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, type, color, icon, profile_type, created_at, updated_at",
    )
    .bind(user.id)
    .bind(payload.name)
    .bind(payload.r#type)
    .bind(payload.color)
    .bind(payload.icon)
    .bind(profile_type)
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(category)))
}

/// PUT /api/v1/categories/:id
/// Atualiza uma categoria existente do usuário logado.
pub async fn update(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Query(params): Query<CategoryProfileParams>,
    Json(payload): Json<UpdateCategoryDto>,
) -> ApiResult<Json<CategoryDto>> {
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Busca a categoria para garantir que ela existe e pertence ao usuário
    let profile_type = params.profile_type.unwrap_or(ProfileType::Personal);
    let current = sqlx::query_as::<_, CategoryDto>(
        "SELECT id, name, type, color, icon, profile_type, created_at, updated_at
         FROM categories WHERE id = $1 AND user_id = $2 AND profile_type = $3 AND is_active = true",
    )
    .bind(id)
    .bind(user.id)
    .bind(profile_type)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let new_name = payload.name.unwrap_or(current.name);
    let new_color = payload.color.unwrap_or(current.color);
    let new_icon = payload.icon.or(current.icon);

    let updated = sqlx::query_as::<_, CategoryDto>(
        "UPDATE categories SET name = $1, color = $2, icon = $3
         WHERE id = $4 AND user_id = $5 AND profile_type = $6
         RETURNING id, name, type, color, icon, profile_type, created_at, updated_at",
    )
    .bind(new_name)
    .bind(new_color)
    .bind(new_icon)
    .bind(id)
    .bind(user.id)
    .bind(profile_type)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(updated))
}

/// DELETE /api/v1/categories/:id
/// Exclui uma categoria. Impede exclusão se existirem transações associadas (Constraint de Banco de Dados).
pub async fn delete(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Query(params): Query<CategoryProfileParams>,
) -> ApiResult<StatusCode> {
    // Tenta deletar fisicamente. Se houver transações atreladas,
    // a FK transactions_category_id_fkey causará um erro de constraint no Postgres.
    let profile_type = params.profile_type.unwrap_or(ProfileType::Personal);
    let result =
        sqlx::query("DELETE FROM categories WHERE id = $1 AND user_id = $2 AND profile_type = $3")
            .bind(id)
            .bind(user.id)
            .bind(profile_type)
            .execute(&state.pool)
            .await;

    match result {
        Ok(res) => {
            if res.rows_affected() == 0 {
                return Err(ApiError::NotFound);
            }
            Ok(StatusCode::NO_CONTENT)
        }
        Err(sqlx::Error::Database(db_err)) if db_err.is_foreign_key_violation() => {
            Err(ApiError::UnprocessableEntity(
                "Não é possível excluir esta categoria porque existem lançamentos vinculados a ela. Remova ou altere as categorias dos lançamentos primeiro.".into(),
            ))
        }
        Err(e) => Err(e.into()),
    }
}
