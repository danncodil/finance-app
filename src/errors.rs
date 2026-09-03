// src/errors.rs
// Tipos de erro centralizados com implementação de IntoResponse para Axum.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

/// Erro padronizado da API, implementa `IntoResponse` para Axum converter
/// automaticamente em resposta HTTP com JSON.
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Recurso não encontrado")]
    NotFound,

    #[error("Dados inválidos: {0}")]
    BadRequest(String),

    #[error("Credenciais inválidas")]
    Unauthorized,

    #[error("Acesso negado")]
    Forbidden,

    #[error("Conflito: {0}")]
    Conflict(String),

    #[error("Entidade não processável: {0}")]
    UnprocessableEntity(String),

    #[error("Erro interno do servidor")]
    Internal(#[from] anyhow::Error),

    #[error("Erro de banco de dados")]
    Database(#[from] sqlx::Error),
}

/// Corpo JSON padronizado de resposta de erro.
#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            ApiError::NotFound => (
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                self.to_string(),
            ),
            ApiError::BadRequest(_) => (
                StatusCode::BAD_REQUEST,
                "BAD_REQUEST",
                self.to_string(),
            ),
            ApiError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "UNAUTHORIZED",
                self.to_string(),
            ),
            ApiError::Forbidden => (
                StatusCode::FORBIDDEN,
                "FORBIDDEN",
                self.to_string(),
            ),
            ApiError::Conflict(_) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                self.to_string(),
            ),
            ApiError::UnprocessableEntity(_) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "UNPROCESSABLE_ENTITY",
                self.to_string(),
            ),
            ApiError::Internal(err) => {
                tracing::error!(error = ?err, "Erro interno não tratado");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    "Erro interno do servidor".to_string(),
                )
            }
            ApiError::Database(err) => {
                tracing::error!(error = ?err, "Erro de banco de dados");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR",
                    "Erro interno do servidor".to_string(),
                )
            }
        };

        let body = ErrorBody {
            error: ErrorDetail { code, message },
        };

        (status, Json(body)).into_response()
    }
}

/// Alias para Result com ApiError.
pub type ApiResult<T> = Result<T, ApiError>;
