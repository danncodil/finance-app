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
pub async fn list(user: AuthUser, State(state): State<AppState>) -> ApiResult<Json<Vec<GoalDto>>> {
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
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    if payload.title.trim().chars().count() < 2
        || payload.target_amount <= rust_decimal::Decimal::ZERO
    {
        return Err(ApiError::BadRequest(
            "Título inválido ou valor da meta deve ser maior que zero".into(),
        ));
    }

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
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    if payload.amount_to_add.is_some() && payload.current_amount.is_some() {
        return Err(ApiError::BadRequest(
            "Informe o saldo ou o aporte, não ambos".into(),
        ));
    }
    if payload
        .amount_to_add
        .is_some_and(|v| v <= rust_decimal::Decimal::ZERO)
    {
        return Err(ApiError::BadRequest(
            "O aporte deve ser maior que zero".into(),
        ));
    }
    let mut tx = state.pool.begin().await?;
    let current = sqlx::query_as::<_, GoalDto>(
        "SELECT * FROM goals WHERE id = $1 AND user_id = $2 FOR UPDATE",
    )
    .bind(id)
    .bind(user.id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(ApiError::NotFound)?;
    let new_amount = payload.current_amount.unwrap_or(current.current_amount)
        + payload.amount_to_add.unwrap_or_default();
    let target = payload.target_amount.unwrap_or(current.target_amount);
    let title = payload.title.unwrap_or(current.title);
    if title.trim().chars().count() < 2
        || target <= rust_decimal::Decimal::ZERO
        || new_amount < rust_decimal::Decimal::ZERO
    {
        return Err(ApiError::BadRequest(
            "Título inválido ou valores fora do intervalo permitido".into(),
        ));
    }
    let completed = new_amount >= target;
    if payload.is_completed.is_some_and(|value| value != completed) {
        return Err(ApiError::BadRequest(
            "A conclusão deve corresponder ao saldo da meta".into(),
        ));
    }
    let reached_50_percent = new_amount >= target * rust_decimal::Decimal::new(5, 1)
        && current.current_amount < current.target_amount * rust_decimal::Decimal::new(5, 1);
    let updated = sqlx::query_as::<_, GoalDto>(
        "UPDATE goals SET title = $1, target_amount = $2, current_amount = $3, deadline = $4, is_completed = $5 WHERE id = $6 AND user_id = $7 RETURNING *"
    ).bind(title.trim()).bind(target).bind(new_amount)
        .bind(payload.deadline.unwrap_or(current.deadline)).bind(completed)
        .bind(id).bind(user.id).fetch_one(&mut *tx).await?;
    tx.commit().await?;
    let mut unlocked_achievement = None;

    if reached_50_percent {
        unlocked_achievement = crate::gamification::service::try_unlock_achievement(
            &state.pool,
            user.id,
            "Foco de Aço",
            "Atingiu 50% de uma meta",
            "target",
            100,
            "half_goal",
        )
        .await
        .unwrap_or_else(|error| {
            tracing::warn!(%error, "Falha ao atualizar conquista da meta");
            None
        });
    }

    Ok(Json(crate::goals::model::UpdateGoalResponse {
        goal: updated,
        unlocked_achievement,
    }))
}

/// DELETE /api/v1/goals/:id
/// Remove uma meta pertencente ao usuário autenticado.
pub async fn delete(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> ApiResult<StatusCode> {
    let result = sqlx::query(
        r#"
        DELETE FROM goals
        WHERE id = $1 AND user_id = $2
        "#,
    )
    .bind(id)
    .bind(user.id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
