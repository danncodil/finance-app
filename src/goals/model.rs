use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct GoalDto {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub target_amount: Decimal,
    pub current_amount: Decimal,
    pub deadline: Option<NaiveDate>,
    pub is_completed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateGoalDto {
    #[serde(alias = "name")]
    #[validate(length(
        min = 2,
        max = 255,
        message = "O título deve ter entre 2 e 255 caracteres"
    ))]
    pub title: String,
    pub target_amount: Decimal,
    pub deadline: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateGoalDto {
    #[serde(alias = "name")]
    #[validate(length(min = 2, max = 255))]
    pub title: Option<String>,
    pub target_amount: Option<Decimal>,
    #[serde(default, deserialize_with = "crate::patch::nullable")]
    pub deadline: Option<Option<NaiveDate>>,
    pub amount_to_add: Option<Decimal>,
    pub current_amount: Option<Decimal>,
    pub is_completed: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct UpdateGoalResponse {
    pub goal: GoalDto,
    pub unlocked_achievement: Option<crate::gamification::model::AchievementDto>,
}
