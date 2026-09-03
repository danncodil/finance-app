use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    errors::{ApiError, ApiResult},
    goals::model::{CreateGoalDto, GoalDto, UpdateGoalDto},
    AppState,
};

/// GET /api/v1/goals
/// Lista todas as metas do usuário logado.
pub async fn list(
    user: AuthUser,
    State(state): State<AppState>,
) -> ApiResult<Json<Vec<GoalDto>>> {
    let goals = sqlx::query_as!(
        GoalDto,
        r#"
        SELECT 
            id, user_id, title, target_amount, current_amount, 
            deadline, is_completed, created_at, updated_at
        FROM goals
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
        user.id
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(goals))
}

/// POST /api/v1/goals
/// Cria uma nova meta financeira.
pub async fn create(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateGoalDto>,
) -> ApiResult<(StatusCode, Json<GoalDto>)> {
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Default current_amount for a new goal is 0
    let current_amount = rust_decimal::Decimal::new(0, 0);

    let goal = sqlx::query_as!(
        GoalDto,
        r#"
        INSERT INTO goals (user_id, title, target_amount, current_amount, deadline)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, user_id, title, target_amount, current_amount, deadline, is_completed, created_at, updated_at
        "#,
        user.id,
        payload.title,
        payload.target_amount,
        current_amount,
        payload.deadline
    )
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::CREATED, Json(goal)))
}

/// PUT /api/v1/goals/:id
/// Atualiza uma meta (foco em current_amount e is_completed).
pub async fn update(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateGoalDto>,
) -> ApiResult<Json<crate::goals::model::UpdateGoalResponse>> {
    payload.validate().map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Busca a meta atual para verificar o target_amount e a quantia atual
    let current = sqlx::query!(
        r#"
        SELECT current_amount, is_completed, target_amount
        FROM goals
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let new_amount = payload.current_amount.unwrap_or(current.current_amount);
    let new_completed = payload.is_completed.unwrap_or(current.is_completed);

    // Identifica se acabamos de atingir a marca de 50%
    let reached_50_percent = new_amount >= (current.target_amount * rust_decimal::Decimal::new(5, 1)) // target_amount * 0.5
        && current.current_amount < (current.target_amount * rust_decimal::Decimal::new(5, 1));

    let updated = sqlx::query_as!(
        GoalDto,
        r#"
        UPDATE goals
        SET current_amount = $1, is_completed = $2
        WHERE id = $3 AND user_id = $4
        RETURNING id, user_id, title, target_amount, current_amount, deadline, is_completed, created_at, updated_at
        "#,
        new_amount,
        new_completed,
        id,
        user.id
    )
    .fetch_one(&state.pool)
    .await?;

    let mut unlocked_achievement = None;

    if reached_50_percent {
        unlocked_achievement = crate::gamification::service::try_unlock_achievement(
            &state.pool,
            user.id,
            "Foco de Aço",
            "Atingiu 50% de uma meta",
            "target",
            100,
            "half_goal"
        ).await?;
    }

    Ok(Json(crate::goals::model::UpdateGoalResponse {
        goal: updated,
        unlocked_achievement,
    }))
}
