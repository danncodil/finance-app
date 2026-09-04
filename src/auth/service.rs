use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::auth::model::Claims;
use crate::config::JwtConfig;
use crate::errors::{ApiError, ApiResult};

/// Faz o hash de uma senha em texto puro usando Argon2id.
pub fn hash_password(password: &str) -> ApiResult<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(anyhow::anyhow!("Erro ao fazer hash da senha: {}", e)))?
        .to_string();

    Ok(password_hash)
}

/// Verifica se a senha em texto puro corresponde ao hash armazenado (Argon2id).
pub fn verify_password(password: &str, password_hash: &str) -> ApiResult<bool> {
    let parsed_hash = PasswordHash::new(password_hash)
        .map_err(|e| ApiError::Internal(anyhow::anyhow!("Hash inválido no banco: {}", e)))?;

    let is_valid = Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();

    Ok(is_valid)
}

/// Gera um JWT Access Token para o usuário.
pub fn generate_access_token(user_id: Uuid, config: &JwtConfig) -> ApiResult<String> {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    let expiration = now + (config.access_expiration_minutes as usize * 60);

    let claims = Claims {
        sub: user_id.to_string(),
        iat: now,
        exp: expiration,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.secret.as_bytes()),
    )
    .map_err(|e| ApiError::Internal(anyhow::anyhow!("Erro ao gerar JWT: {}", e)))?;

    Ok(token)
}

/// Valida um JWT Access Token e retorna as Claims se for válido.
pub fn validate_token(token: &str, config: &JwtConfig) -> ApiResult<Claims> {
    let validation = jsonwebtoken::Validation::default();
    
    let token_data = jsonwebtoken::decode::<Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(config.secret.as_bytes()),
        &validation
    ).map_err(|_| ApiError::Unauthorized)?;

    // Validação manual de expiração (opcional, o jsonwebtoken::decode já valida se expiração estiver na struct Claims e Validation default)
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as usize;

    if token_data.claims.exp < now {
        return Err(ApiError::Unauthorized);
    }

    Ok(token_data.claims)
}

/// Faz o hash de um token de refresh (SHA256) antes de armazenar no banco.
pub fn hash_refresh_token(token: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}
