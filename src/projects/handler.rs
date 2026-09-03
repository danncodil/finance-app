use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    errors::{ApiError, ApiResult},
    projects::model::{
        CreateProjectDto, ListProjectsParams, ProjectDto, ProjectStatus, UpdateProjectDto,
    },
    AppState,
};

// ── POST /api/v1/projects ────────────────────────────────────

/// Cria um novo projeto para o usuário autenticado.
pub async fn create(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateProjectDto>,
) -> ApiResult<(StatusCode, Json<ProjectDto>)> {
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    let status = payload.status.unwrap_or(ProjectStatus::Active);

    let project = sqlx::query_as!(
        ProjectDto,
        r#"
        INSERT INTO projects (user_id, name, description, budget, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, budget, status as "status: ProjectStatus", created_at, updated_at
        "#,
        user.id,
        payload.name,
        payload.description,
        payload.budget,
        status as ProjectStatus,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(project)))
}

// ── GET /api/v1/projects ─────────────────────────────────────

/// Lista todos os projetos do usuário, com filtro opcional por status.
/// Exemplo: GET /api/v1/projects?status=active
pub async fn list(
    user: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<ListProjectsParams>,
) -> ApiResult<Json<Vec<ProjectDto>>> {
    let projects = match params.status {
        Some(status_filter) => {
            sqlx::query_as!(
                ProjectDto,
                r#"
                SELECT id, name, description, budget, status as "status: ProjectStatus", created_at, updated_at
                FROM projects
                WHERE user_id = $1 AND status = $2
                ORDER BY created_at DESC
                "#,
                user.id,
                status_filter as ProjectStatus,
            )
            .fetch_all(&state.pool)
            .await?
        }
        None => {
            sqlx::query_as!(
                ProjectDto,
                r#"
                SELECT id, name, description, budget, status as "status: ProjectStatus", created_at, updated_at
                FROM projects
                WHERE user_id = $1
                ORDER BY created_at DESC
                "#,
                user.id,
            )
            .fetch_all(&state.pool)
            .await?
        }
    };

    Ok(Json(projects))
}

// ── GET /api/v1/projects/:id ─────────────────────────────────

/// Retorna um projeto específico pelo ID.
pub async fn get_by_id(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> ApiResult<Json<ProjectDto>> {
    let project = sqlx::query_as!(
        ProjectDto,
        r#"
        SELECT id, name, description, budget, status as "status: ProjectStatus", created_at, updated_at
        FROM projects
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id,
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(project))
}

// ── PUT /api/v1/projects/:id ─────────────────────────────────

/// Atualiza parcialmente um projeto. Apenas os campos enviados são alterados.
pub async fn update(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProjectDto>,
) -> ApiResult<Json<ProjectDto>> {
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Busca o estado atual para aplicar patch
    let current = sqlx::query!(
        r#"
        SELECT name, description, budget, status as "status: ProjectStatus"
        FROM projects
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id,
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let new_name        = payload.name.unwrap_or(current.name);
    let new_description = payload.description.or(current.description);
    let new_budget      = payload.budget.or(current.budget);
    let new_status      = payload.status.unwrap_or(current.status);

    let updated = sqlx::query_as!(
        ProjectDto,
        r#"
        UPDATE projects
        SET name = $1, description = $2, budget = $3, status = $4
        WHERE id = $5 AND user_id = $6
        RETURNING id, name, description, budget, status as "status: ProjectStatus", created_at, updated_at
        "#,
        new_name,
        new_description,
        new_budget,
        new_status as ProjectStatus,
        id,
        user.id,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(updated))
}

// ── DELETE /api/v1/projects/:id ──────────────────────────────

/// Remove um projeto. As transações vinculadas têm project_id definido como NULL (ON DELETE SET NULL).
pub async fn delete(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> ApiResult<StatusCode> {
    let result = sqlx::query!(
        r#"
        DELETE FROM projects
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id,
    )
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
