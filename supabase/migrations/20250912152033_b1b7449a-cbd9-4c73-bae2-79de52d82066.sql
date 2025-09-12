-- Remove duplicate evaluations keeping only the latest one
DELETE FROM evaluations a USING evaluations b 
WHERE a.id < b.id 
AND a.inscription_id = b.inscription_id 
AND a.evaluator_id = b.evaluator_id;

-- Add unique constraint to prevent duplicate evaluations (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_inscription_evaluator') THEN
        ALTER TABLE evaluations 
        ADD CONSTRAINT unique_inscription_evaluator 
        UNIQUE (inscription_id, evaluator_id);
    END IF;
END $$;