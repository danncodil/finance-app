use axum::{extract::State, http::StatusCode, Json};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::{
        middleware::AuthUser,
        model::{
            AuthResponse, LoginRequest, RegisterRequest, UpdatePasswordRequest,
            UpdateProfileRequest, UserDto,
        },
        service,
    },
    categories::model::CategoryDto,
    errors::{ApiError, ApiResult},
    transactions::model::TransactionDto,
    AppState,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ExportDataResponse {
    pub categories: Vec<CategoryDto>,
    pub transactions: Vec<TransactionDto>,
}

/// POST /api/v1/auth/register
/// Cria um novo usuário, faz o hash da senha e retorna tokens.
pub async fn register(
    State(state): State<AppState>,
    Json(payload): Json<RegisterRequest>,
) -> ApiResult<(StatusCode, Json<AuthResponse>)> {
    // 1. Valida payload
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }

    // 2. Hash da senha
    let hashed_password = service::hash_password(&payload.password)?;

    // 3. Insere usuário no banco
    let user_record = sqlx::query!(
        r#"
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
        "#,
        payload.name,
        payload.email,
        hashed_password
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        // Trata erro de unique constraint para o e-mail
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.constraint() == Some("uq_users_email") {
                return ApiError::Conflict("Este e-mail já está em uso".to_string());
            }
        }
        ApiError::Database(e)
    })?;

    // 4. Gera tokens JWT (access)
    let access_token = service::generate_access_token(user_record.id, &state.config.jwt)?;
    
    // 5. Gera refresh token (Simulação por enquanto - será salvo no BD na rotação completa)
    let refresh_token = Uuid::new_v4().to_string();

    // 6. Monta resposta
    let response = AuthResponse {
        user: UserDto {
            id: user_record.id,
            name: user_record.name,
            email: user_record.email,
            created_at: user_record.created_at,
        },
        access_token,
        refresh_token,
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// POST /api/v1/auth/login
/// Autentica o usuário com e-mail e senha, retornando os tokens.
pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> ApiResult<Json<AuthResponse>> {
    // 1. Valida payload
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }

    // 2. Busca usuário pelo e-mail
    let user_record = sqlx::query!(
        r#"
        SELECT id, name, email, password_hash, created_at, is_active
        FROM users
        WHERE email = $1
        "#,
        payload.email
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::Unauthorized)?; // Retorna Unauthorized genérico por segurança

    // 3. Verifica se conta está ativa
    if !user_record.is_active {
        return Err(ApiError::Forbidden);
    }

    // 4. Valida senha via Argon2
    let is_valid = service::verify_password(&payload.password, &user_record.password_hash)?;
    if !is_valid {
        return Err(ApiError::Unauthorized); // Retorna Unauthorized genérico por segurança
    }

    // 5. Gera tokens JWT (access)
    let access_token = service::generate_access_token(user_record.id, &state.config.jwt)?;
    
    // 6. Gera refresh token (Simulação por enquanto)
    let refresh_token = Uuid::new_v4().to_string();

    // 7. Monta resposta
    let response = AuthResponse {
        user: UserDto {
            id: user_record.id,
            name: user_record.name,
            email: user_record.email,
            created_at: user_record.created_at,
        },
        access_token,
        refresh_token,
    };

    Ok(Json(response))
}

/// GET /api/v1/users/profile
pub async fn get_profile(
    user: AuthUser,
    State(state): State<AppState>,
) -> ApiResult<Json<UserDto>> {
    let user_record = sqlx::query!(
        r#"
        SELECT id, name, email, created_at
        FROM users
        WHERE id = $1
        "#,
        user.id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;
    
    Ok(Json(UserDto {
        id: user_record.id,
        name: user_record.name,
        email: user_record.email,
        created_at: user_record.created_at,
    }))
}

/// PUT /api/v1/users/profile
pub async fn update_profile(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpdateProfileRequest>,
) -> ApiResult<Json<UserDto>> {
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }
    
    let current_user = sqlx::query!("SELECT name, email FROM users WHERE id = $1", user.id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;
        
    let new_name = payload.name.unwrap_or(current_user.name);
    let new_email = payload.email.unwrap_or(current_user.email);
    
    let user_record = sqlx::query!(
        r#"
        UPDATE users
        SET name = $1, email = $2
        WHERE id = $3
        RETURNING id, name, email, created_at
        "#,
        new_name,
        new_email,
        user.id
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(db_err) = &e {
            if db_err.constraint() == Some("uq_users_email") {
                return ApiError::Conflict("Este e-mail já está em uso".to_string());
            }
        }
        ApiError::Database(e)
    })?;
    
    Ok(Json(UserDto {
        id: user_record.id,
        name: user_record.name,
        email: user_record.email,
        created_at: user_record.created_at,
    }))
}

/// PUT /api/v1/users/password
pub async fn update_password(
    user: AuthUser,
    State(state): State<AppState>,
    Json(payload): Json<UpdatePasswordRequest>,
) -> ApiResult<StatusCode> {
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }
    
    let user_record = sqlx::query!("SELECT password_hash FROM users WHERE id = $1", user.id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;
        
    let is_valid = service::verify_password(&payload.current_password, &user_record.password_hash)?;
    if !is_valid {
        return Err(ApiError::BadRequest("A senha atual está incorreta".into()));
    }
    
    let new_hashed = service::hash_password(&payload.new_password)?;
    
    sqlx::query!("UPDATE users SET password_hash = $1 WHERE id = $2", new_hashed, user.id)
        .execute(&state.pool)
        .await?;
        
    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/v1/users/export/data
pub async fn export_data(
    user: AuthUser,
    State(state): State<AppState>,
) -> ApiResult<Json<ExportDataResponse>> {
    let categories = sqlx::query_as!(
        CategoryDto,
        r#"
        SELECT id, name, type as "type: _", color, icon, created_at, updated_at
        FROM categories
        WHERE user_id = $1
        ORDER BY created_at ASC
        "#,
        user.id
    )
    .fetch_all(&state.pool)
    .await?;

    let transactions = sqlx::query_as!(
        TransactionDto,
        r#"
        SELECT id, category_id, type as "type: _", amount, description, transaction_date, created_at, updated_at,
               type_recurrence as "type_recurrence: _", installment_current, installment_total, parent_id,
               profile_type as "profile_type: _", project_id
        FROM transactions
        WHERE user_id = $1
        ORDER BY transaction_date DESC
        "#,
        user.id
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(ExportDataResponse {
        categories,
        transactions,
    }))
}
