use axum::{extract::State, Json};

use crate::{
    auth::middleware::AuthUser,
    errors::ApiResult,
    gamification::model::{AchievementDto, GamificationStatusDto},
    AppState,
};

/// GET /api/v1/gamification/status
/// Retorna o XP, nível atual e todos os selos (achievements) desbloqueados pelo usuário.
pub async fn status(
    user: AuthUser,
    State(state): State<AppState>,
) -> ApiResult<Json<GamificationStatusDto>> {
    // 1. Busca XP e Nível do usuário.
    // Como a tabela user_gamification é populada apenas quando há progresso,
    // podemos usar um fallback para garantir que retorne 0/1 se não existir ainda.

    let user_status = sqlx::query!(
        r#"
        SELECT xp_points, current_level
        FROM user_gamification
        WHERE user_id = $1
        "#,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?;

    let (xp_points, current_level) = match user_status {
        Some(row) => (row.xp_points, row.current_level),
        None => (0, 1),
    };

    // 2. Busca os selos desbloqueados fazendo JOIN.
    let achievements = sqlx::query_as!(
        AchievementDto,
        r#"
        SELECT 
            a.id, a.name, a.description, a.icon_slug, a.xp_reward, 
            a.rule_type, a.rule_value, ua.unlocked_at
        FROM achievements a
        INNER JOIN user_achievements ua ON a.id = ua.achievement_id
        WHERE ua.user_id = $1
        ORDER BY ua.unlocked_at DESC
        "#,
        user.id
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(GamificationStatusDto {
        xp_points,
        current_level,
        unlocked_achievements: achievements,
    }))
}
