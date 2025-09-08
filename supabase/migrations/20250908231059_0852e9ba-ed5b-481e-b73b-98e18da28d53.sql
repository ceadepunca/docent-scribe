-- Add new columns to evaluations table for secondary-specific evaluations
ALTER TABLE public.evaluations 
ADD COLUMN subject_selection_id UUID REFERENCES public.inscription_subject_selections(id),
ADD COLUMN position_selection_id UUID REFERENCES public.inscription_position_selections(id),
ADD COLUMN title_type TEXT CHECK (title_type IN ('docente', 'habilitante', 'supletorio'));

-- Update the unique constraint to allow multiple evaluations per inscription for different selections
-- First drop the existing constraint if it exists
ALTER TABLE public.evaluations DROP CONSTRAINT IF EXISTS evaluations_inscription_id_evaluator_id_key;

-- Add new composite unique constraint that allows multiple evaluations per inscription
-- but ensures uniqueness per specific selection
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_unique_per_selection 
UNIQUE (inscription_id, evaluator_id, subject_selection_id, position_selection_id);

-- Add constraint to ensure either general evaluation OR specific selection evaluation
ALTER TABLE public.evaluations 
ADD CONSTRAINT evaluations_selection_logic 
CHECK (
  -- General evaluation (for inicial/primario): no selection references
  (subject_selection_id IS NULL AND position_selection_id IS NULL AND title_type IS NULL)
  OR
  -- Specific subject evaluation (for secundario): has subject_selection_id
  (subject_selection_id IS NOT NULL AND position_selection_id IS NULL AND title_type IS NOT NULL)
  OR
  -- Specific position evaluation (for secundario): has position_selection_id  
  (subject_selection_id IS NULL AND position_selection_id IS NOT NULL AND title_type IS NOT NULL)
);