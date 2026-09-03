-- ============================================================
--  Migration 004: Tabela transactions (lançamentos)
--  Cada lançamento pertence a um usuário e a uma categoria.
-- ============================================================

CREATE TABLE transactions (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID                NOT NULL,
    category_id         UUID                NOT NULL,
    type                transaction_type    NOT NULL,
    amount              DECIMAL(15,2)       NOT NULL,
    description         VARCHAR(500),
    transaction_date    DATE                NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,

    -- Valor deve ser positivo
    CONSTRAINT chk_transactions_amount CHECK (amount > 0)
);

-- Índice geral por usuário
CREATE INDEX idx_transactions_user ON transactions (user_id);

-- Índice para listagem ordenada por data (mais recente primeiro)
CREATE INDEX idx_transactions_date ON transactions (user_id, transaction_date DESC);

-- Índice para filtrar por tipo (income/expense)
CREATE INDEX idx_transactions_type ON transactions (user_id, type);

-- Índice para filtrar por categoria
CREATE INDEX idx_transactions_category ON transactions (user_id, category_id);

-- Covering index para relatórios de resumo (evita table heap access)
CREATE INDEX idx_transactions_date_range ON transactions (user_id, transaction_date)
    INCLUDE (type, amount);
