use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::categories::model::TransactionType;

// ── Enums ────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "recurrence_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum RecurrenceType {
    Unique,
    Installment,
    Subscription,
}

/// Perfil da transação: pessoal (PF) ou empresarial (PJ).
#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "profile_type", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "snake_case")]
pub enum ProfileType {
    Personal,
    Business,
}

// ── DTOs ─────────────────────────────────────────────────────

/// Representa uma transação retornada pela API.
#[derive(Debug, Serialize, Deserialize)]
pub struct TransactionDto {
    pub id: Uuid,
    pub category_id: Uuid,
    pub r#type: TransactionType,
    pub amount: Decimal,
    pub description: Option<String>,
    pub type_recurrence: RecurrenceType,
    pub installment_current: Option<i32>,
    pub installment_total: Option<i32>,
    pub parent_id: Option<Uuid>,
    pub transaction_date: NaiveDate,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    /// Perfil da transação: 'personal' (PF) ou 'business' (PJ).
    pub profile_type: ProfileType,
    /// Projeto vinculado à transação (opcional).
    pub project_id: Option<Uuid>,
}

/// Payload para criação de uma transação.
#[derive(Debug, Deserialize, Validate)]
pub struct CreateTransactionDto {
    pub category_id: Uuid,
    pub r#type: TransactionType,

    // Validando que o amount deve ser maior que 0
    // O Validator Rust não tem uma validação embutida para Decimal,
    // mas a validação será garantida pelo banco (CHECK constraint).
    pub amount: Decimal,

    #[validate(length(max = 500, message = "A descrição pode ter no máximo 500 caracteres"))]
    pub description: Option<String>,

    pub type_recurrence: Option<RecurrenceType>, // Default to Unique if not provided
    pub installment_total: Option<i32>,

    pub transaction_date: Option<NaiveDate>,

    /// Perfil da transação. Padrão: 'personal'.
    pub profile_type: Option<ProfileType>,

    /// Vincula a transação a um projeto existente (opcional).
    pub project_id: Option<Uuid>,
}

/// Payload para atualização parcial de uma transação.
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateTransactionDto {
    pub category_id: Option<Uuid>,
    pub r#type: Option<TransactionType>,
    pub amount: Option<Decimal>,

    #[validate(length(max = 500, message = "A descrição pode ter no máximo 500 caracteres"))]
    pub description: Option<String>,

    pub transaction_date: Option<NaiveDate>,

    /// Permite trocar o perfil de uma transação existente.
    pub profile_type: Option<ProfileType>,

    /// Permite vincular ou desvincular a transação de um projeto.
    /// Envie `null` explicitamente para desvincular.
    #[serde(default, deserialize_with = "crate::patch::nullable")]
    pub project_id: Option<Option<Uuid>>,
}

// ── Responses ────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct TransactionsSummary {
    pub balance: Decimal,
    pub total_income: Decimal,
    pub total_expense: Decimal,
}

#[derive(Debug, Serialize)]
pub struct ListTransactionsResponse {
    pub summary: TransactionsSummary,
    pub transactions: Vec<TransactionDto>,
}

/// Query params para listagem de transações.
#[derive(Debug, Deserialize)]
pub struct ListTransactionsParams {
    /// Filtra por perfil: 'personal' ou 'business'.
    #[serde(alias = "profile_type")]
    pub profile: Option<ProfileType>,
}
