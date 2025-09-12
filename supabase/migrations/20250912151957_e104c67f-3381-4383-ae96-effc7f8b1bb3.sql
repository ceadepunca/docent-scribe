-- First, remove duplicate evaluations keeping only the latest one
DELETE FROM evaluations a USING evaluations b 
WHERE a.id < b.id 
AND a.inscription_id = b.inscription_id 
AND a.evaluator_id = b.evaluator_id;

-- Add foreign key constraints for proper table relationships
ALTER TABLE evaluations 
ADD CONSTRAINT fk_evaluations_inscription_id 
FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE;

ALTER TABLE evaluations 
ADD CONSTRAINT fk_evaluations_evaluator_id 
FOREIGN KEY (evaluator_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate evaluations
ALTER TABLE evaluations 
ADD CONSTRAINT unique_inscription_evaluator 
UNIQUE (inscription_id, evaluator_id);

-- Add foreign key for inscriptions -> profiles relationship
ALTER TABLE inscriptions 
ADD CONSTRAINT fk_inscriptions_user_profile 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;