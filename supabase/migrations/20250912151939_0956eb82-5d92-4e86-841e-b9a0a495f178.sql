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