use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use rust_decimal::Decimal;
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::middleware::AuthUser,
    categories::model::TransactionType,
    errors::{ApiError, ApiResult},
    transactions::model::{
        CreateTransactionDto, ListTransactionsParams, ListTransactionsResponse, ProfileType,
        TransactionDto, TransactionsSummary, UpdateTransactionDto,
    },
    AppState,
};

use crate::transactions::model::RecurrenceType;
use chrono::Months;

use crate::gamification::model::AchievementDto;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CreateTransactionResponse {
    pub transactions: Vec<TransactionDto>,
    pub unlocked_achievements: Vec<AchievementDto>,
}

/// POST /api/v1/transactions
pub async fn create(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<CreateTransactionDto>,
) -> ApiResult<(StatusCode, Json<CreateTransactionResponse>)> {
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    let category_exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)",
        payload.category_id,
        user.id
    )
    .fetch_one(&state.pool)
    .await?
    .unwrap_or(false);

    if !category_exists {
        return Err(ApiError::BadRequest(
            "Categoria inválida ou não pertence ao usuário".to_string(),
        ));
    }

    // Valida o project_id se informado: deve pertencer ao usuário
    if let Some(pid) = payload.project_id {
        let project_exists = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1 AND user_id = $2)",
            pid,
            user.id
        )
        .fetch_one(&state.pool)
        .await?
        .unwrap_or(false);

        if !project_exists {
            return Err(ApiError::BadRequest(
                "Projeto inválido ou não pertence ao usuário".to_string(),
            ));
        }
    }

    let tx_date = payload
        .transaction_date
        .unwrap_or_else(|| Utc::now().naive_utc().date());
    let type_recurrence = payload.type_recurrence.unwrap_or(RecurrenceType::Unique);
    let installment_total = payload.installment_total.unwrap_or(1);
    let profile_type = payload.profile_type.unwrap_or(ProfileType::Personal);

    if type_recurrence == RecurrenceType::Installment && installment_total < 2 {
        return Err(ApiError::BadRequest(
            "O número de parcelas deve ser pelo menos 2".into(),
        ));
    }

    let mut created_txs = Vec::new();
    let mut db_tx = state.pool.begin().await?;

    if type_recurrence == RecurrenceType::Installment {
        let total_amount = payload.amount;
        let num_installments = Decimal::new(installment_total as i64, 0);
        let base_amount = (total_amount / num_installments).round_dp(2);

        let mut amounts = vec![base_amount; installment_total as usize];
        let sum_base: Decimal = amounts.iter().sum();
        let diff = total_amount - sum_base;
        amounts[0] += diff;

        let mut ids = vec![];
        for _ in 0..installment_total {
            ids.push(Uuid::new_v4());
        }
        let parent_id = ids[0];

        let base_desc = payload.description.clone().unwrap_or_default();

        for i in 0..installment_total {
            let next_date = tx_date
                .checked_add_months(Months::new(i as u32))
                .unwrap_or(tx_date);
            let current_id = ids[i as usize];
            let current_parent = if i == 0 { None } else { Some(parent_id) };
            let current_amount = amounts[i as usize];

            let desc = format!("{} - Parcela {}/{}", base_desc, i + 1, installment_total);

            let tx = sqlx::query_as!(
                TransactionDto,
                r#"
                INSERT INTO transactions
                    (id, user_id, category_id, type, amount, description, transaction_date,
                     type_recurrence, installment_current, installment_total, parent_id,
                     profile_type, project_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING
                    id, category_id,
                    type            as "type: TransactionType",
                    amount, description, transaction_date, created_at, updated_at,
                    type_recurrence as "type_recurrence: RecurrenceType",
                    installment_current, installment_total, parent_id,
                    profile_type    as "profile_type: ProfileType",
                    project_id
                "#,
                current_id,
                user.id,
                payload.category_id,
                payload.r#type as TransactionType,
                current_amount,
                desc,
                next_date,
                type_recurrence as RecurrenceType,
                (i + 1) as i32,
                installment_total,
                current_parent,
                profile_type as ProfileType,
                payload.project_id,
            )
            .fetch_one(&mut *db_tx)
            .await
            .map_err(|e| {
                if let sqlx::Error::Database(db_err) = &e {
                    if db_err.constraint() == Some("chk_transactions_amount") {
                        return ApiError::UnprocessableEntity(
                            "O valor (amount) deve ser maior que 0".to_string(),
                        );
                    }
                }
                ApiError::Database(e)
            })?;
            created_txs.push(tx);
        }
    } else if type_recurrence == RecurrenceType::Subscription {
        let base_desc = payload.description.clone().unwrap_or_default();
        let total_months = 12;

        let mut ids = vec![];
        for _ in 0..total_months {
            ids.push(Uuid::new_v4());
        }
        let parent_id = ids[0];

        for i in 0..total_months {
            let next_date = tx_date
                .checked_add_months(Months::new(i as u32))
                .unwrap_or(tx_date);
            let current_id = ids[i as usize];
            let current_parent = if i == 0 { None } else { Some(parent_id) };

            let tx = sqlx::query_as!(
                TransactionDto,
                r#"
                INSERT INTO transactions
                    (id, user_id, category_id, type, amount, description, transaction_date,
                     type_recurrence, parent_id, profile_type, project_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING
                    id, category_id,
                    type            as "type: TransactionType",
                    amount, description, transaction_date, created_at, updated_at,
                    type_recurrence as "type_recurrence: RecurrenceType",
                    installment_current, installment_total, parent_id,
                    profile_type    as "profile_type: ProfileType",
                    project_id
                "#,
                current_id,
                user.id,
                payload.category_id,
                payload.r#type as TransactionType,
                payload.amount,
                base_desc.clone(),
                next_date,
                type_recurrence as RecurrenceType,
                current_parent,
                profile_type as ProfileType,
                payload.project_id,
            )
            .fetch_one(&mut *db_tx)
            .await
            .map_err(|e| {
                if let sqlx::Error::Database(db_err) = &e {
                    if db_err.constraint() == Some("chk_transactions_amount") {
                        return ApiError::UnprocessableEntity(
                            "O valor (amount) deve ser maior que 0".to_string(),
                        );
                    }
                }
                ApiError::Database(e)
            })?;
            created_txs.push(tx);
        }
    } else {
        let tx = sqlx::query_as!(
            TransactionDto,
            r#"
            INSERT INTO transactions
                (user_id, category_id, type, amount, description, transaction_date,
                 type_recurrence, profile_type, project_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING
                id, category_id,
                type            as "type: TransactionType",
                amount, description, transaction_date, created_at, updated_at,
                type_recurrence as "type_recurrence: RecurrenceType",
                installment_current, installment_total, parent_id,
                profile_type    as "profile_type: ProfileType",
                project_id
            "#,
            user.id,
            payload.category_id,
            payload.r#type as TransactionType,
            payload.amount,
            payload.description.clone(),
            tx_date,
            type_recurrence as RecurrenceType,
            profile_type as ProfileType,
            payload.project_id,
        )
        .fetch_one(&mut *db_tx)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.constraint() == Some("chk_transactions_amount") {
                    return ApiError::UnprocessableEntity(
                        "O valor (amount) deve ser maior que 0".to_string(),
                    );
                }
            }
            ApiError::Database(e)
        })?;
        created_txs.push(tx);
    }

    db_tx.commit().await?;

    let mut unlocked_achievements = Vec::new();

    // 1. Visão de Futuro
    if type_recurrence == RecurrenceType::Installment
        || type_recurrence == RecurrenceType::Subscription
    {
        if let Some(ach) = crate::gamification::service::try_unlock_achievement(
            &state.pool,
            user.id,
            "Visão de Futuro",
            "Automatizar e planejar os próximos meses",
            "telescope",
            50,
            "first_recurrent",
        )
        .await?
        {
            unlocked_achievements.push(ach);
        }
    }

    // 2. Multi-Renda
    if payload.r#type == TransactionType::Income {
        let distinct_income_categories = sqlx::query_scalar!(
            r#"
            SELECT COUNT(DISTINCT category_id) 
            FROM transactions 
            WHERE user_id = $1 
              AND type = 'income' 
              AND date_trunc('month', transaction_date) = date_trunc('month', $2::date)
            "#,
            user.id,
            tx_date
        )
        .fetch_one(&state.pool)
        .await?
        .unwrap_or(0);

        if distinct_income_categories >= 2 {
            if let Some(ach) = crate::gamification::service::try_unlock_achievement(
                &state.pool,
                user.id,
                "Multi-Renda",
                "Receitas de duas ou mais fontes no mesmo mês",
                "wallet",
                75,
                "multi_income",
            )
            .await?
            {
                unlocked_achievements.push(ach);
            }
        }
    }

    // 3. Consistência (3 dias seguidos)
    // Verifica se houve transação na data da nova transação (hoje), ontem e anteontem
    let consecutive_days = sqlx::query_scalar!(
        r#"
        SELECT COUNT(DISTINCT transaction_date) 
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_date >= $2::date - INTERVAL '2 days'
          AND transaction_date <= $2::date
        "#,
        user.id,
        tx_date
    )
    .fetch_one(&state.pool)
    .await?
    .unwrap_or(0);

    if consecutive_days >= 3 {
        if let Some(ach) = crate::gamification::service::try_unlock_achievement(
            &state.pool,
            user.id,
            "Consistência",
            "Registrou lançamentos por 3 dias consecutivos",
            "calendar",
            50,
            "consistency_3_days",
        )
        .await?
        {
            unlocked_achievements.push(ach);
        }
    }

    Ok((
        StatusCode::CREATED,
        Json(CreateTransactionResponse {
            transactions: created_txs,
            unlocked_achievements,
        }),
    ))
}

/// GET /api/v1/transactions
/// Retorna a lista de transações e o resumo calculado via SQL.
/// Query params opcionais:
///   - ?profile=personal  → apenas transações pessoais (PF)
///   - ?profile=business  → apenas transações do negócio (PJ)
///   - (sem parâmetro)    → todos os perfis
pub async fn list(
    user: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<ListTransactionsParams>,
) -> ApiResult<Json<ListTransactionsResponse>> {
    // Calcula o resumo financeiro respeitando o filtro de perfil
    let (summary, transactions) = match params.profile {
        Some(profile_filter) => {
            let summary = sqlx::query_as!(
                TransactionsSummary,
                r#"
                SELECT
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as "balance!",
                    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) as "total_income!",
                    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as "total_expense!"
                FROM transactions
                WHERE user_id = $1 AND profile_type = $2
                "#,
                user.id,
                profile_filter as ProfileType,
            )
            .fetch_one(&state.pool)
            .await?;

            let transactions = sqlx::query_as!(
                TransactionDto,
                r#"
                SELECT
                    id, category_id,
                    type            as "type: TransactionType",
                    amount, description, transaction_date, created_at, updated_at,
                    type_recurrence as "type_recurrence: RecurrenceType",
                    installment_current, installment_total, parent_id,
                    profile_type    as "profile_type: ProfileType",
                    project_id
                FROM transactions
                WHERE user_id = $1 AND profile_type = $2
                ORDER BY transaction_date DESC, created_at DESC
                "#,
                user.id,
                profile_filter as ProfileType,
            )
            .fetch_all(&state.pool)
            .await?;

            (summary, transactions)
        }
        None => {
            let summary = sqlx::query_as!(
                TransactionsSummary,
                r#"
                SELECT
                    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as "balance!",
                    COALESCE(SUM(amount) FILTER (WHERE type = 'income'),  0) as "total_income!",
                    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as "total_expense!"
                FROM transactions
                WHERE user_id = $1
                "#,
                user.id,
            )
            .fetch_one(&state.pool)
            .await?;

            let transactions = sqlx::query_as!(
                TransactionDto,
                r#"
                SELECT
                    id, category_id,
                    type            as "type: TransactionType",
                    amount, description, transaction_date, created_at, updated_at,
                    type_recurrence as "type_recurrence: RecurrenceType",
                    installment_current, installment_total, parent_id,
                    profile_type    as "profile_type: ProfileType",
                    project_id
                FROM transactions
                WHERE user_id = $1
                ORDER BY transaction_date DESC, created_at DESC
                "#,
                user.id,
            )
            .fetch_all(&state.pool)
            .await?;

            (summary, transactions)
        }
    };

    Ok(Json(ListTransactionsResponse {
        summary: TransactionsSummary {
            balance: summary.balance,
            total_income: summary.total_income,
            total_expense: summary.total_expense,
        },
        transactions,
    }))
}

/// GET /api/v1/transactions/:id
pub async fn get_by_id(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> ApiResult<Json<TransactionDto>> {
    let transaction = sqlx::query_as!(
        TransactionDto,
        r#"
        SELECT
            id, category_id,
            type            as "type: TransactionType",
            amount, description, transaction_date, created_at, updated_at,
            type_recurrence as "type_recurrence: RecurrenceType",
            installment_current, installment_total, parent_id,
            profile_type    as "profile_type: ProfileType",
            project_id
        FROM transactions
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(transaction))
}

/// PUT /api/v1/transactions/:id
pub async fn update(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<UpdateTransactionDto>,
) -> ApiResult<Json<TransactionDto>> {
    payload
        .validate()
        .map_err(|e| ApiError::BadRequest(e.to_string()))?;

    // Busca o registro atual para aplicar patch
    let current = sqlx::query!(
        r#"
        SELECT
            category_id,
            type            as "type: TransactionType",
            amount, description, transaction_date,
            profile_type    as "profile_type: ProfileType",
            project_id
        FROM transactions
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    // Se estiver tentando mudar a categoria, verifica se ela existe e pertence ao usuário
    let new_category_id = payload.category_id.unwrap_or(current.category_id);
    if payload.category_id.is_some() && payload.category_id.unwrap() != current.category_id {
        let category_exists = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM categories WHERE id = $1 AND user_id = $2)",
            new_category_id,
            user.id
        )
        .fetch_one(&state.pool)
        .await?
        .unwrap_or(false);

        if !category_exists {
            return Err(ApiError::BadRequest(
                "Categoria inválida ou não pertence ao usuário".to_string(),
            ));
        }
    }

    // Se estiver tentando mudar o projeto, verifica se ele existe e pertence ao usuário
    let new_project_id = payload.project_id.unwrap_or(current.project_id);
    if let Some(pid) = new_project_id {
        let project_exists = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM projects WHERE id = $1 AND user_id = $2)",
            pid,
            user.id
        )
        .fetch_one(&state.pool)
        .await?
        .unwrap_or(false);

        if !project_exists {
            return Err(ApiError::BadRequest(
                "Projeto inválido ou não pertence ao usuário".to_string(),
            ));
        }
    }

    let new_type = payload.r#type.unwrap_or(current.r#type);
    let new_amount = payload.amount.unwrap_or(current.amount);
    let new_description = payload.description.or(current.description);
    let new_date = payload.transaction_date.unwrap_or(current.transaction_date);
    let new_profile = payload.profile_type.unwrap_or(current.profile_type);

    let updated = sqlx::query_as!(
        TransactionDto,
        r#"
        UPDATE transactions
        SET
            category_id      = $1,
            type             = $2,
            amount           = $3,
            description      = $4,
            transaction_date = $5,
            profile_type     = $6,
            project_id       = $7
        WHERE id = $8 AND user_id = $9
        RETURNING
            id, category_id,
            type            as "type: TransactionType",
            amount, description, transaction_date, created_at, updated_at,
            type_recurrence as "type_recurrence: RecurrenceType",
            installment_current, installment_total, parent_id,
            profile_type    as "profile_type: ProfileType",
            project_id
        "#,
        new_category_id,
        new_type as TransactionType,
        new_amount,
        new_description,
        new_date,
        new_profile as ProfileType,
        new_project_id,
        id,
        user.id
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.constraint() == Some("chk_transactions_amount") {
                return ApiError::UnprocessableEntity(
                    "O valor (amount) deve ser maior que 0".to_string(),
                );
            }
        }
        ApiError::Database(e)
    })?;

    Ok(Json(updated))
}

/// DELETE /api/v1/transactions/:id
pub async fn delete(
    user: AuthUser,
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> ApiResult<StatusCode> {
    let result = sqlx::query!(
        r#"
        DELETE FROM transactions
        WHERE id = $1 AND user_id = $2
        "#,
        id,
        user.id
    )
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(StatusCode::NO_CONTENT)
}
