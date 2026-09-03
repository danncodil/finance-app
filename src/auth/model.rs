use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize)]
pub struct UserDto {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(length(min = 3, message = "O nome deve ter no mínimo 3 caracteres"))]
    pub name: String,
    #[validate(email(message = "E-mail inválido"))]
    pub email: String,
    #[validate(length(min = 6, message = "A senha deve ter no mínimo 6 caracteres"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "E-mail inválido"))]
    pub email: String,
    #[validate(length(min = 1, message = "A senha é obrigatória"))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub user: UserDto,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // Uuid do usuário convertido para String
    pub exp: usize,  // Timestamp de expiração (UTC)
    pub iat: usize,  // Timestamp de emissão (UTC)
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 3, message = "O nome deve ter no mínimo 3 caracteres"))]
    pub name: Option<String>,
    #[validate(email(message = "E-mail inválido"))]
    pub email: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePasswordRequest {
    #[validate(length(min = 1, message = "A senha atual é obrigatória"))]
    pub current_password: String,
    #[validate(length(min = 6, message = "A nova senha deve ter no mínimo 6 caracteres"))]
    pub new_password: String,
}
