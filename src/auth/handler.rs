use axum::{extract::State, http::StatusCode, Json};
use uuid::Uuid;
use validator::Validate;

use crate::{
    auth::{
        middleware::AuthUser,
        model::{
            AuthResponse, LoginRequest, RefreshRequest, RegisterRequest, UpdatePasswordRequest,
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
    pub profile: UserDto,
    pub projects: Vec<crate::projects::model::ProjectDto>,
    pub goals: Vec<crate::goals::model::GoalDto>,
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

    // 5. Gera refresh token e salva no banco
    let refresh_token = Uuid::new_v4().to_string();
    let hashed_rt = service::hash_refresh_token(&refresh_token);
    let expires_at =
        chrono::Utc::now() + chrono::Duration::days(state.config.jwt.refresh_expiration_days);

    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        "#,
        user_record.id,
        hashed_rt,
        expires_at
    )
    .execute(&state.pool)
    .await?;

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

    // 6. Gera refresh token e salva no banco
    let refresh_token = Uuid::new_v4().to_string();
    let hashed_rt = service::hash_refresh_token(&refresh_token);
    let expires_at =
        chrono::Utc::now() + chrono::Duration::days(state.config.jwt.refresh_expiration_days);

    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        "#,
        user_record.id,
        hashed_rt,
        expires_at
    )
    .execute(&state.pool)
    .await?;

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

/// POST /api/v1/auth/refresh
/// Gera um novo access_token a partir de um refresh_token válido.
/// Por segurança, geramos um novo refresh_token (rotação) e revogamos o antigo.
pub async fn refresh(
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> ApiResult<Json<AuthResponse>> {
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }

    let hashed_rt = service::hash_refresh_token(&payload.refresh_token);

    // Busca o token no banco
    let token_record = sqlx::query!(
        r#"
        SELECT id, user_id, expires_at, revoked
        FROM refresh_tokens
        WHERE token_hash = $1
        "#,
        hashed_rt
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::Unauthorized)?;

    if token_record.revoked {
        return Err(ApiError::Unauthorized);
    }

    if token_record.expires_at < chrono::Utc::now() {
        return Err(ApiError::Unauthorized);
    }

    // Busca o usuário
    let user_record = sqlx::query!(
        r#"
        SELECT id, name, email, created_at, is_active
        FROM users
        WHERE id = $1
        "#,
        token_record.user_id
    )
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::Unauthorized)?;

    if !user_record.is_active {
        return Err(ApiError::Forbidden);
    }

    // Revoga o token atual (rotação)
    sqlx::query!(
        "UPDATE refresh_tokens SET revoked = true WHERE id = $1",
        token_record.id
    )
    .execute(&state.pool)
    .await?;

    // Gera novos tokens
    let access_token = service::generate_access_token(user_record.id, &state.config.jwt)?;

    let new_refresh_token = Uuid::new_v4().to_string();
    let new_hashed_rt = service::hash_refresh_token(&new_refresh_token);
    let expires_at =
        chrono::Utc::now() + chrono::Duration::days(state.config.jwt.refresh_expiration_days);

    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        "#,
        user_record.id,
        new_hashed_rt,
        expires_at
    )
    .execute(&state.pool)
    .await?;

    let response = AuthResponse {
        user: UserDto {
            id: user_record.id,
            name: user_record.name,
            email: user_record.email,
            created_at: user_record.created_at,
        },
        access_token,
        refresh_token: new_refresh_token,
    };

    Ok(Json(response))
}

/// POST /api/v1/auth/logout
/// Revoga o refresh_token informado, invalidando-o para uso futuro.
pub async fn logout(
    State(state): State<AppState>,
    Json(payload): Json<RefreshRequest>,
) -> ApiResult<StatusCode> {
    if let Err(e) = payload.validate() {
        return Err(ApiError::BadRequest(e.to_string()));
    }

    let hashed_rt = service::hash_refresh_token(&payload.refresh_token);

    let result = sqlx::query!(
        "UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1",
        hashed_rt
    )
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        // Se o token não existia ou já estava revogado, não expomos erro para não vazar info.
        return Ok(StatusCode::NO_CONTENT);
    }

    Ok(StatusCode::NO_CONTENT)
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

    sqlx::query!(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        new_hashed,
        user.id
    )
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

    let Json(profile) = get_profile(user.clone(), State(state.clone())).await?;
    let projects = sqlx::query_as::<_, crate::projects::model::ProjectDto>(
        "SELECT id, name, description, budget, status, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY created_at"
    ).bind(user.id).fetch_all(&state.pool).await?;
    let goals = sqlx::query_as::<_, crate::goals::model::GoalDto>(
        "SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at",
    )
    .bind(user.id)
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(ExportDataResponse {
        profile,
        projects,
        goals,
        categories,
        transactions,
    }))
}
