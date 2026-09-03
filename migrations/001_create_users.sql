-- ============================================================
--  Migration 001: Extensões + Tabela users
--  Sistema de Gestão Financeira
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipo ENUM para classificar receita/despesa
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- ============================================================
--  TABELA: users
--  Armazena dados de autenticação e perfil do usuário.
-- ============================================================
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Índice para busca rápida por e-mail no login
CREATE INDEX idx_users_email ON users (email);
