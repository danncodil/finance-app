-- ============================================================
--  Migration 008: Gamificação e Metas
--  Tabelas: goals, user_gamification, achievements, user_achievements
-- ============================================================

-- 1. Metas Financeiras (goals)
CREATE TABLE goals (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID            NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    target_amount   NUMERIC(15,2)   NOT NULL,
    current_amount  NUMERIC(15,2)   NOT NULL DEFAULT 0.00,
    deadline        DATE,
    is_completed    BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Índice para listar as metas de um usuário
CREATE INDEX idx_goals_user ON goals (user_id);

-- Trigger para atualização do campo updated_at
CREATE TRIGGER trg_goals_updated_at
    BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- 2. Status de Nível e XP (user_gamification)
CREATE TABLE user_gamification (
    user_id         UUID            PRIMARY KEY,
    xp_points       INT             NOT NULL DEFAULT 0,
    current_level   INT             NOT NULL DEFAULT 1,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_gamification_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Trigger para atualização do campo updated_at
CREATE TRIGGER trg_user_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- 3. Catálogo Global de Selos (achievements)
CREATE TABLE achievements (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            NOT NULL,
    icon_slug       VARCHAR(100)    NOT NULL,
    xp_reward       INT             NOT NULL DEFAULT 0,
    rule_type       VARCHAR(100)    NOT NULL,
    rule_value      NUMERIC(15,2),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Trigger para atualização do campo updated_at
CREATE TRIGGER trg_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- ============================================================
-- 4. Selos Desbloqueados pelos Usuários (user_achievements)
CREATE TABLE user_achievements (
    user_id         UUID            NOT NULL,
    achievement_id  UUID            NOT NULL,
    unlocked_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, achievement_id),

    CONSTRAINT fk_ua_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        
    CONSTRAINT fk_ua_achievement
        FOREIGN KEY (achievement_id) REFERENCES achievements (id) ON DELETE CASCADE
);

-- Índices para buscas rápidas de selos do usuário
CREATE INDEX idx_user_achievements_user ON user_achievements (user_id);
CREATE INDEX idx_user_achievements_achievement ON user_achievements (achievement_id);
