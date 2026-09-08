// src/db/mod.rs
// Cria e configura o pool de conexões PostgreSQL via SQLx.

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

use crate::config::DatabaseConfig;

/// Cria o pool de conexões PostgreSQL.
///
/// # Erros
/// Retorna erro se não conseguir conectar ao banco.
pub async fn create_pool(config: &DatabaseConfig) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(config.max_connections)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(&config.url)
        .await?;

    tracing::info!(
        max_connections = config.max_connections,
        "✅ Pool de conexões PostgreSQL criado com sucesso"
    );

    Ok(pool)
}

/// Executa as migrations SQL embutidas no binário.
///
/// As migrations são lidas da pasta `migrations/` em tempo de compilação
/// usando a macro `sqlx::migrate!()`.
pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    tracing::info!("🔄 Executando migrations...");

    sqlx::migrate!("./migrations").run(pool).await?;

    tracing::info!("✅ Migrations executadas com sucesso");

    Ok(())
}
