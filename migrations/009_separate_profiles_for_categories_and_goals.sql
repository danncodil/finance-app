-- ============================================================
-- Migration 009: separa categorias e metas entre PF e PJ.
-- Dados existentes permanecem no perfil pessoal para compatibilidade.
-- ============================================================

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS profile_type profile_type NOT NULL DEFAULT 'PERSONAL';

ALTER TABLE goals
    ADD COLUMN IF NOT EXISTS profile_type profile_type NOT NULL DEFAULT 'PERSONAL';

-- A restrição anterior não permitia a mesma categoria em PF e PJ.
ALTER TABLE categories
    DROP CONSTRAINT IF EXISTS uq_categories_user_name_type;

ALTER TABLE categories
    ADD CONSTRAINT uq_categories_user_profile_name_type
        UNIQUE (user_id, profile_type, name, type);

-- Categorias já usadas por transações PJ são copiadas e os lançamentos passam
-- a apontar para a cópia PJ. Dados legados permanecem utilizáveis nos dois perfis.
CREATE TEMP TABLE category_profile_mapping (
    old_id UUID PRIMARY KEY,
    new_id UUID NOT NULL
) ON COMMIT PRESERVE ROWS;

INSERT INTO category_profile_mapping (old_id, new_id)
SELECT DISTINCT c.id, uuid_generate_v4()
FROM categories c
JOIN transactions t ON t.category_id = c.id
WHERE t.profile_type = 'BUSINESS';

INSERT INTO categories (
    id, user_id, name, type, color, icon, is_active, created_at, updated_at, profile_type
)
SELECT m.new_id, c.user_id, c.name, c.type, c.color, c.icon, c.is_active,
       c.created_at, c.updated_at, 'BUSINESS'
FROM category_profile_mapping m
JOIN categories c ON c.id = m.old_id;

UPDATE transactions t
SET category_id = m.new_id
FROM category_profile_mapping m
WHERE t.category_id = m.old_id
  AND t.profile_type = 'BUSINESS';

DROP TABLE category_profile_mapping;

CREATE INDEX IF NOT EXISTS idx_categories_user_profile
    ON categories (user_id, profile_type)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_goals_user_profile
    ON goals (user_id, profile_type);
