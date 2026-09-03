-- ============================================================
--  Migration 002: Tabela refresh_tokens
--  Gerencia tokens de refresh para rotação segura de JWT.
-- ============================================================

CREATE TABLE refresh_tokens (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL,
    token_hash      VARCHAR(255)    NOT NULL,
    expires_at      TIMESTAMPTZ     NOT NULL,
    revoked         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT uq_refresh_tokens_hash UNIQUE (token_hash)
);

-- Índice para buscar tokens por usuário
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

-- Índice parcial: apenas tokens válidos (não revogados) e não expirados
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens (expires_at)
    WHERE revoked = FALSE;
