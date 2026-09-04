use sqlx::PgPool;
use uuid::Uuid;
use crate::gamification::model::AchievementDto;

pub async fn try_unlock_achievement(
    pool: &PgPool,
    user_id: Uuid,
    name: &str,
    description: &str,
    icon_slug: &str,
    xp_reward: i32,
    rule_type: &str,
) -> Result<Option<AchievementDto>, sqlx::Error> {
    let achievement = sqlx::query_as!(
        AchievementDto,
        r#"
        WITH new_ach AS (
            INSERT INTO achievements (name, description, icon_slug, xp_reward, rule_type)
            SELECT $1, $2, $3, $4, $5::varchar
            WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE rule_type = $5::varchar)
            RETURNING id, name, description, icon_slug, xp_reward, rule_type, rule_value, created_at as unlocked_at
        )
        SELECT 
            id as "id!", name as "name!", description as "description!", 
            icon_slug as "icon_slug!", xp_reward as "xp_reward!", 
            rule_type as "rule_type!", rule_value, unlocked_at as "unlocked_at!"
        FROM new_ach
        UNION ALL
        SELECT 
            id as "id!", name as "name!", description as "description!", 
            icon_slug as "icon_slug!", xp_reward as "xp_reward!", 
            rule_type as "rule_type!", rule_value, created_at as "unlocked_at!"
        FROM achievements WHERE rule_type = $5::varchar
        LIMIT 1
        "#,
        name,
        description,
        icon_slug,
        xp_reward,
        rule_type
    )
    .fetch_one(pool)
    .await?;

    let insert_res = sqlx::query!(
        "INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        user_id,
        achievement.id
    )
    .execute(pool)
    .await?;

    if insert_res.rows_affected() > 0 {
        sqlx::query!(
            r#"
            INSERT INTO user_gamification (user_id, xp_points, current_level)
            VALUES ($1, $2, 1)
            ON CONFLICT (user_id) DO UPDATE SET
                xp_points = user_gamification.xp_points + EXCLUDED.xp_points,
                current_level = 1 + ((user_gamification.xp_points + EXCLUDED.xp_points) / 200)
            "#,
            user_id,
            achievement.xp_reward
        )
        .execute(pool)
        .await?;
        return Ok(Some(achievement));
    }

    Ok(None)
}
