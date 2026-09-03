use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    categories::model::{CategoryDto, CreateCategoryDto, TransactionType, UpdateCategoryDto},
    errors::{ApiError, ApiResult},
    AppState,
};

/// GET /api/v1/categories
/// Lista todas as categorias vinculadas ao usuário logado.
pub async fn list(
    user: AuthUser,
    State(state): State<AppState>,
) -> ApiResult<Json<Vec<CategoryDto>>> {
    let categories = sqlx::query_as!(
        CategoryDto,
        r#"
        SELECT id, name, type as "type: TransactionType", color, icon, created_at, updated_at
        FROM categories
        WHERE user_id = $1 AND is_active = true
        ORDER BY name ASC
        "#,
        user.id
    )
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
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    let category = sqlx::query_as!(
        CategoryDto,
        r#"
        INSERT INTO categories (user_id, name, type, color, icon)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, type as "type: TransactionType", color, icon, created_at, updated_at
        "#,
        user.id,
        payload.name,
        payload.r#type as TransactionType,
        payload.color,
        payload.icon
    )
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
    Json(payload): Json<UpdateCategoryDto>,
) -> ApiResult<Json<CategoryDto>> {
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Busca a categoria para garantir que ela existe e pertence ao usuário
    let current = sqlx::query!(
        r#"
        SELECT name, color, icon
        FROM categories
        WHERE id = $1 AND user_id = $2 AND is_active = true
        "#,
        id,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let new_name = payload.name.unwrap_or(current.name);
    let new_color = payload.color.unwrap_or(current.color);
    let new_icon = payload.icon.or(current.icon);

    let updated = sqlx::query_as!(
        CategoryDto,
        r#"
        UPDATE categories
        SET name = $1, color = $2, icon = $3
        WHERE id = $4 AND user_id = $5
        RETURNING id, name, type as "type: TransactionType", color, icon, created_at, updated_at
        "#,
        new_name,
        new_color,
        new_icon,
        id,
        user.id
    )
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
) -> ApiResult<StatusCode> {
    // Tenta deletar fisicamente. Se houver transações atreladas, 
    // a FK transactions_category_id_fkey causará um erro de constraint no Postgres.
    let result = sqlx::query!(
        r#"
        DELETE FROM categories
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id
    )
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
