use axum::{
    extract::{FromRef, FromRequestParts},
    http::{header::AUTHORIZATION, request::Parts},
};
use uuid::Uuid;

use crate::{auth::service::validate_token, errors::ApiError, AppState};

/// Estrutura injetável em qualquer rota (handler) que necessite de autenticação.
/// Ao colocar `AuthUser` como argumento do handler, o Axum automaticamente
/// executará o código `from_request_parts` abaixo antes de chamar o handler.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
}

impl<S> FromRequestParts<S> for AuthUser
where
    // Garante que conseguimos extrair o AppState a partir do estado global S
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // 1. Extrai o cabeçalho Authorization
        let auth_header = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .ok_or(ApiError::Unauthorized)?;

        // 2. Verifica se está no formato correto "Bearer <token>"
        if !auth_header.starts_with("Bearer ") {
            return Err(ApiError::Unauthorized);
        }

        let token = &auth_header["Bearer ".len()..];

        // 3. Extrai o estado da aplicação (precisamos do JwtConfig)
        let app_state = AppState::from_ref(state);

        // 4. Valida a assinatura e expiração do token JWT
        let claims = validate_token(token, &app_state.config.jwt)?;

        // 5. Converte o 'subject' (sub) do token para Uuid
        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| ApiError::Unauthorized)?;

        // 6. Retorna o usuário autenticado para ser usado no handler da rota
        Ok(AuthUser { id: user_id })
    }
}
