// src/main.rs
// Bootstrap: inicializa tracing, carrega config, conecta ao PostgreSQL,
// monta todas as rotas da API e levanta o servidor Axum.

mod assistant;
mod auth;
mod categories;
mod config;
mod db;
mod errors;
mod gamification;
mod goals;
mod patch;
mod projects;
mod reports;
mod transactions;

use std::sync::Arc;

use axum::http::{HeaderValue, Method};
use axum::routing::get;
use axum::{Json, Router};
use serde::Serialize;
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

use crate::config::AppConfig;

// ── Estado global compartilhado entre handlers ──────────────────────────

/// Estado da aplicação injetado em todos os handlers via Axum State.
#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Arc<AppConfig>,
    /// Cliente HTTP reutilizável (connection pooling para chamadas externas, ex: Gemini).
    pub http_client: reqwest::Client,
}

// ── Health check ────────────────────────────────────────────────────────

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

/// GET /api/v1/health — verifica se a API está no ar.
async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

// ── Montagem de rotas ───────────────────────────────────────────────────

/// Monta o router principal com todos os grupos de rotas.
fn build_router(state: AppState) -> Router {
    // Rotas públicas (sem autenticação)
    let public_routes = Router::new().route("/health", get(health_check));

    // Rotas de autenticação
    let auth_routes = Router::new()
        .route("/register", axum::routing::post(auth::handler::register))
        .route("/login", axum::routing::post(auth::handler::login))
        .route("/refresh", axum::routing::post(auth::handler::refresh))
        .route("/logout", axum::routing::post(auth::handler::logout));

    // Rotas de usuários (protegidas)
    let user_routes = Router::new()
        // Rota de demonstração do middleware de autenticação (AuthUser)
        .route(
            "/me/demo",
            get(|user: auth::middleware::AuthUser| async move {
                format!(
                    "Olá! Acesso autorizado. Seu ID extraído do JWT é: {}",
                    user.id
                )
            }),
        )
        .route(
            "/profile",
            axum::routing::get(auth::handler::get_profile).put(auth::handler::update_profile),
        )
        .route(
            "/password",
            axum::routing::put(auth::handler::update_password),
        )
        .route(
            "/export/data",
            axum::routing::get(auth::handler::export_data),
        );

    // Monta a árvore de rotas da API v1
    let api_v1_routes = Router::new()
        .merge(public_routes) // /health
        .nest("/auth", auth_routes)
        .nest("/users", user_routes)
        // Categorias
        .route(
            "/categories",
            axum::routing::get(categories::handler::list).post(categories::handler::create),
        )
        .route(
            "/categories/{id}",
            axum::routing::put(categories::handler::update).delete(categories::handler::delete),
        )
        // Transações
        .route(
            "/transactions",
            axum::routing::get(transactions::handler::list).post(transactions::handler::create),
        )
        .route(
            "/transactions/{id}",
            axum::routing::get(transactions::handler::get_by_id)
                .put(transactions::handler::update)
                .delete(transactions::handler::delete),
        )
        // Projetos
        .route(
            "/projects",
            axum::routing::get(projects::handler::list).post(projects::handler::create),
        )
        .route(
            "/projects/{id}",
            axum::routing::get(projects::handler::get_by_id)
                .put(projects::handler::update)
                .delete(projects::handler::delete),
        )
        // Relatórios
        .route(
            "/reports/summary",
            axum::routing::get(reports::handler::summary),
        )
        // Assistente IA
        .route(
            "/assistant/parse",
            axum::routing::post(assistant::handler::parse_text),
        )
        // Metas
        .route(
            "/goals",
            axum::routing::get(goals::handler::list).post(goals::handler::create),
        )
        .route(
            "/goals/{id}",
            axum::routing::put(goals::handler::update).delete(goals::handler::delete),
        )
        // Gamificação
        .route(
            "/gamification/status",
            axum::routing::get(gamification::handler::status),
        );

    // Monta o layer de CORS baseado na configuração do ambiente
    let cors = if state.config.cors_origin == "*" {
        CorsLayer::new()
            .allow_origin(tower_http::cors::Any)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::PATCH,
                Method::DELETE,
            ])
            .allow_headers(tower_http::cors::Any)
    } else {
        let origin: HeaderValue = state
            .config
            .cors_origin
            .parse()
            .expect("CORS_ORIGIN deve ser uma URL válida (ex: http://localhost:5173)");
        CorsLayer::new()
            .allow_origin(origin)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::PATCH,
                Method::DELETE,
            ])
            .allow_headers(tower_http::cors::Any)
    };

    // Monta a árvore completa sob /api/v1
    Router::new()
        .nest("/api/v1", api_v1_routes)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

// ── Entry point ─────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    // 1. Carrega variáveis do arquivo .env (se existir)
    dotenvy::dotenv().ok();

    // 2. Inicializa o sistema de logs estruturados
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("gestao_financeira=debug,tower_http=debug")),
        )
        .with_target(true)
        .with_thread_ids(false)
        .init();

    tracing::info!("🚀 Iniciando Gestão Financeira API...");

    // 3. Carrega configuração tipada do ambiente
    let config = AppConfig::from_env();
    let addr = format!("{}:{}", config.host, config.port);

    // 4. Cria pool de conexões PostgreSQL
    let pool = db::create_pool(&config.database)
        .await
        .expect("❌ Falha ao conectar ao PostgreSQL");

    // 5. Executa migrations automaticamente
    db::run_migrations(&pool)
        .await
        .expect("❌ Falha ao executar migrations");

    // 6. Monta o estado compartilhado
    let state = AppState {
        pool,
        config: Arc::new(config),
        http_client: reqwest::Client::new(),
    };

    // 7. Constrói o router com todas as rotas
    let app = build_router(state);

    // 8. Levanta o servidor HTTP
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("❌ Falha ao fazer bind na porta");

    tracing::info!("✅ Servidor rodando em http://{}", addr);

    axum::serve(listener, app)
        .await
        .expect("❌ Falha ao iniciar o servidor Axum");
}
