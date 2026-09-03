# ══════════════════════════════════════════════════════════════
# ESTÁGIO 1 — Compilação (Builder)
# Imagem pesada com todo o toolchain do Rust, usada APENAS
# para gerar o binário otimizado em modo release.
# ══════════════════════════════════════════════════════════════
FROM rust:latest AS builder

# Dependências de sistema para compilar crates com bindings C (openssl, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Cache de dependências ────────────────────────────────────
# Copiamos apenas o manifesto e criamos um main.rs "dummy" para
# que o Docker faça cache da compilação das dependências (crates).
# Isso evita recompilar tudo quando só o código-fonte muda.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# ── Compilação do código real ────────────────────────────────
# Copia todo o código-fonte, migrations e a pasta .sqlx (offline)
COPY src/ src/
COPY migrations/ migrations/
COPY .sqlx/ .sqlx/

# Habilita o modo offline do SQLx para não precisar de conexão
# com o banco de dados durante a compilação dentro do Docker.
# (Gerado previamente com: cargo sqlx prepare)
ENV SQLX_OFFLINE=true

# Força a recompilação do nosso binário (não das deps em cache)
RUN touch src/main.rs && cargo build --release

# ══════════════════════════════════════════════════════════════
# ESTÁGIO 2 — Runtime (Imagem Final Super Leve ~80MB)
# Apenas o binário compilado + certificados SSL.
# Sem compilador, sem código-fonte, sem cargo.
# ══════════════════════════════════════════════════════════════
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates libssl3 curl && \
    rm -rf /var/lib/apt/lists/*

# Cria um usuário não-root para segurança
RUN useradd --create-home --shell /bin/bash appuser

WORKDIR /app

# Copia apenas o binário compilado
COPY --from=builder /app/target/release/gestao-financeira /usr/local/bin/gestao-financeira

# Copia as migrations para o runtime (necessário para sqlx::migrate!)
COPY --from=builder /app/migrations ./migrations

# Define o usuário não-root
USER appuser

EXPOSE 3333

# Healthcheck interno do container
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fs http://localhost:3333/api/v1/health || exit 1

CMD ["gestao-financeira"]
