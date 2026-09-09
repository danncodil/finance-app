use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{categories::model::TransactionType, transactions::model::ProfileType};

#[derive(Debug, Deserialize)]
pub struct ParseRequest {
    pub text: String,
    pub profile_type: Option<ProfileType>,
    pub reference_date: Option<NaiveDate>,
}

/// Model output is an untrusted proposal, validated against the user's data.
#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedTransaction {
    pub amount: Option<f64>,
    pub description: String,
    pub transaction_type: Option<TransactionType>,
    pub transaction_date: Option<NaiveDate>,
    pub category_id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub clarification: Option<String>,
    pub entry_kind: String,
    #[serde(default = "personal_profile")]
    pub profile_type: ProfileType,
}

fn personal_profile() -> ProfileType {
    ProfileType::Personal
}
