use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

use crate::transactions::model::ProfileType;

#[derive(Debug, Deserialize)]
pub struct SummaryQueryParams {
    pub month: Option<u32>,
    pub year: Option<i32>,
    #[serde(alias = "profile")]
    pub profile_type: Option<ProfileType>,
}

#[derive(Debug, Serialize)]
pub struct CategoryGroup {
    pub category_name: String,
    pub color: String,
    pub amount: Decimal,
    pub percentage: Decimal,
}

#[derive(Debug, Serialize)]
pub struct MonthlyFlow {
    pub month: String,
    pub income: Decimal,
    pub expense: Decimal,
}

#[derive(Debug, Serialize)]
pub struct ReportSummaryResponse {
    pub total_income: Decimal,
    pub total_expense: Decimal,
    pub balance: Decimal,
    pub expenses_by_category: Vec<CategoryGroup>,
    pub monthly_flow: Vec<MonthlyFlow>,
}
