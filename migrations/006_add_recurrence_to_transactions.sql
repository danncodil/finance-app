-- Create the enum type for recurrence if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN 
        CREATE TYPE recurrence_type AS ENUM ('unique', 'installment', 'subscription'); 
    END IF; 
END $$;

-- Add new columns to transactions table if not exists
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS type_recurrence recurrence_type NOT NULL DEFAULT 'unique',
ADD COLUMN IF NOT EXISTS installment_current INT,
ADD COLUMN IF NOT EXISTS installment_total INT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES transactions(id) ON DELETE CASCADE;

-- Add a check constraint to ensure installment correctness
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_installment_values') THEN
        ALTER TABLE transactions
        ADD CONSTRAINT chk_installment_values 
        CHECK (
            (type_recurrence = 'unique' AND installment_current IS NULL AND installment_total IS NULL) OR
            (type_recurrence = 'subscription') OR
            (type_recurrence = 'installment' AND installment_current >= 1 AND installment_total >= 1 AND installment_current <= installment_total)
        );
    END IF;
END $$;
