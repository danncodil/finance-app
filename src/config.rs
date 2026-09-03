// src/config.rs
// Carrega variáveis de ambiente e expõe structs de configuração tipadas.

use std::env;

/// Configuração completa da aplicação, carregada do ambiente (.env).
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub gemini: GeminiConfig,
}

/// Configuração de conexão com o PostgreSQL.
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

/// Configuração de autenticação JWT.
#[derive(Debug, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub access_expiration_minutes: i64,
    pub refresh_expiration_days: i64,
}

/// Configuração do Assistente de IA (Google Gemini)
#[derive(Debug, Clone)]
pub struct GeminiConfig {
    pub api_key: String,
}

impl AppConfig {
    /// Carrega todas as variáveis de ambiente e retorna a configuração.
    /// Panic se alguma variável obrigatória estiver faltando.
    pub fn from_env() -> Self {
        Self {
            host: env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "3333".to_string())
                .parse()
                .expect("PORT deve ser um número válido"),
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .expect("DATABASE_URL é obrigatória"),
                max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .expect("DATABASE_MAX_CONNECTIONS deve ser um número válido"),
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET")
                    .expect("JWT_SECRET é obrigatória"),
                access_expiration_minutes: env::var("JWT_ACCESS_EXPIRATION_MINUTES")
                    .unwrap_or_else(|_| "15".to_string())
                    .parse()
                    .expect("JWT_ACCESS_EXPIRATION_MINUTES deve ser um número válido"),
                refresh_expiration_days: env::var("JWT_REFRESH_EXPIRATION_DAYS")
                    .unwrap_or_else(|_| "7".to_string())
                    .parse()
                    .expect("JWT_REFRESH_EXPIRATION_DAYS deve ser um número válido"),
            },
            gemini: GeminiConfig {
                api_key: env::var("GEMINI_API_KEY")
                    .unwrap_or_else(|_| "MISSING_API_KEY".to_string()),
            },
        }
    }
}
