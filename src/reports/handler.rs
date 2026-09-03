use axum::{
    extract::{Query, State},
    Json,
};
use chrono::{Datelike, Utc};
use rust_decimal::Decimal;

use crate::{
    auth::middleware::AuthUser,
    errors::ApiResult,
    reports::model::{CategoryGroup, MonthlyFlow, ReportSummaryResponse, SummaryQueryParams},
    AppState,
};

pub async fn summary(
    user: AuthUser,
    Query(params): Query<SummaryQueryParams>,
    State(state): State<AppState>,
) -> ApiResult<Json<ReportSummaryResponse>> {
    let now = Utc::now().naive_utc().date();
    let current_year = params.year.unwrap_or(now.year());
    let current_month = params.month.unwrap_or(now.month());

    // 1. Total income, expense, balance for the selected period
    let summary_record = sqlx::query!(
        r#"
        SELECT
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as expense
        FROM transactions
        WHERE user_id = $1
          AND EXTRACT(YEAR FROM transaction_date) = $2
          AND EXTRACT(MONTH FROM transaction_date) = $3
        "#,
        user.id,
        current_year as f64,
        current_month as f64
    )
    .fetch_one(&state.pool)
    .await?;

    let total_income = summary_record.income.unwrap_or_default();
    let total_expense = summary_record.expense.unwrap_or_default();
    let balance = total_income - total_expense;

    // 2. Group expenses by category
    let categories_records = sqlx::query!(
        r#"
        SELECT
            c.name as category_name,
            c.color as color,
            COALESCE(SUM(t.amount), 0) as amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND EXTRACT(YEAR FROM t.transaction_date) = $2
          AND EXTRACT(MONTH FROM t.transaction_date) = $3
        GROUP BY c.id, c.name, c.color
        ORDER BY amount DESC
        "#,
        user.id,
        current_year as f64,
        current_month as f64
    )
    .fetch_all(&state.pool)
    .await?;

    let expenses_by_category = categories_records
        .into_iter()
        .map(|r| {
            let amount = r.amount.unwrap_or_default();
            let percentage = if total_expense > Decimal::ZERO {
                (amount / total_expense) * Decimal::new(100, 0)
            } else {
                Decimal::ZERO
            };
            CategoryGroup {
                category_name: r.category_name,
                color: r.color,
                amount,
                percentage: percentage.round_dp(2),
            }
        })
        .collect();

    // 3. Historical flow (last 6 months)
    let flow_records = sqlx::query!(
        r#"
        SELECT
            to_char(date_trunc('month', transaction_date), 'YYYY-MM') as month,
            COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as income,
            COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as expense
        FROM transactions
        WHERE user_id = $1
          AND transaction_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
        GROUP BY date_trunc('month', transaction_date)
        ORDER BY date_trunc('month', transaction_date) ASC
        "#,
        user.id
    )
    .fetch_all(&state.pool)
    .await?;

    let monthly_flow = flow_records
        .into_iter()
        .map(|r| MonthlyFlow {
            month: r.month.unwrap_or_default(),
            income: r.income.unwrap_or_default(),
            expense: r.expense.unwrap_or_default(),
        })
        .collect();

    Ok(Json(ReportSummaryResponse {
        total_income,
        total_expense,
        balance,
        expenses_by_category,
        monthly_flow,
    }))
}
