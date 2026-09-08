use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct AchievementDto {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub icon_slug: String,
    pub xp_reward: i32,
    pub rule_type: String,
    pub rule_value: Option<Decimal>,
    pub unlocked_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GamificationStatusDto {
    pub xp_points: i32,
    pub current_level: i32,
    pub unlocked_achievements: Vec<AchievementDto>,
}
