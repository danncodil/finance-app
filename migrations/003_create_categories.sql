-- ============================================================
--  Migration 003: Tabela categories
--  Categorias de classificação vinculadas ao usuário.
--  Cada usuário tem suas próprias categorias.
-- ============================================================

CREATE TABLE categories (
    id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID                NOT NULL,
    name            VARCHAR(100)        NOT NULL,
    type            transaction_type    NOT NULL,
    color           VARCHAR(7)          NOT NULL DEFAULT '#6366F1',
    icon            VARCHAR(50),
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    -- Impede categorias duplicadas por tipo para o mesmo usuário
    CONSTRAINT uq_categories_user_name_type UNIQUE (user_id, name, type)
);

-- Índice para listar categorias de um usuário
CREATE INDEX idx_categories_user ON categories (user_id);

-- Índice para filtrar categorias por tipo (income/expense)
CREATE INDEX idx_categories_type ON categories (user_id, type);
