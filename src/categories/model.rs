use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq)]
#[sqlx(type_name = "transaction_type", rename_all = "lowercase")]
#[serde(rename_all = "snake_case")]
pub enum TransactionType {
    Income,
    Expense,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryDto {
    pub id: Uuid,
    pub name: String,
    pub r#type: TransactionType,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct CreateCategoryDto {
    #[validate(length(min = 2, max = 50, message = "O nome deve ter entre 2 e 50 caracteres"))]
    pub name: String,
    pub r#type: TransactionType,
    #[validate(length(min = 4, max = 20))]
    pub color: String,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize, validator::Validate)]
pub struct UpdateCategoryDto {
    #[validate(length(min = 2, max = 50, message = "O nome deve ter entre 2 e 50 caracteres"))]
    pub name: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
    // O tipo (Receita/Despesa) normalmente não pode ser alterado após criação.
}
