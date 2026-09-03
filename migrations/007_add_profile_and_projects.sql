-- ============================================================
--  Migration 007: Suporte a Perfis (PF/PJ) e Gestão de Projetos
--  Fase 1 do roadmap para microempreendedores.
--
--  Alterações:
--    1. Cria ENUM profile_type ('PERSONAL', 'BUSINESS')
--    2. Adiciona coluna profile_type em transactions (DEFAULT 'PERSONAL')
--    3. Cria ENUM project_status ('active', 'completed', 'paused', 'cancelled')
--    4. Cria tabela projects
--    5. Adiciona coluna project_id (FK nullable) em transactions
-- ============================================================

-- ── 1. ENUM: profile_type ────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_type') THEN
        CREATE TYPE profile_type AS ENUM ('PERSONAL', 'BUSINESS');
    END IF;
END $$;

-- ── 2. Coluna profile_type em transactions ───────────────────
-- DEFAULT 'PERSONAL' garante backward compatibility com dados existentes.
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS profile_type profile_type NOT NULL DEFAULT 'PERSONAL';

-- ── 3. ENUM: project_status ──────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
    END IF;
END $$;

-- ── 4. Tabela projects ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    budget          DECIMAL(15,2),
    status          project_status  NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_projects_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

    CONSTRAINT chk_projects_budget CHECK (budget IS NULL OR budget >= 0)
);

-- Índice para listagem dos projetos de um usuário
CREATE INDEX IF NOT EXISTS idx_projects_user      ON projects (user_id);
-- Índice para filtrar projetos por status
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects (user_id, status);

-- ── Trigger updated_at para projects ────────────────────────
-- Reutiliza a função fn_update_timestamp já criada na migration 005.
DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ── 5. Coluna project_id em transactions ─────────────────────
-- Nullable: transações sem projeto continuam funcionando normalmente.
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS project_id UUID
        REFERENCES projects (id) ON DELETE SET NULL;

-- Índice para buscar todas as transações de um projeto
CREATE INDEX IF NOT EXISTS idx_transactions_project ON transactions (project_id)
    WHERE project_id IS NOT NULL;

-- Índice composto para filtrar por perfil dentro do contexto de um usuário
CREATE INDEX IF NOT EXISTS idx_transactions_profile ON transactions (user_id, profile_type);
