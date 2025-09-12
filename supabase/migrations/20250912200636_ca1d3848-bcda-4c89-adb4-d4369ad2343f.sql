-- Drop the problematic unique index that prevents multiple evaluations
DROP INDEX IF EXISTS public.unique_inscription_evaluator;

-- Add last_modified_by column for auditing
ALTER TABLE public.evaluations 
ADD COLUMN IF NOT EXISTS last_modified_by uuid REFERENCES auth.users(id);

-- Update RLS policies to allow any evaluator to update any evaluation
DROP POLICY IF EXISTS "Evaluators can update their own evaluations" ON public.evaluations;

CREATE POLICY "Evaluators can update any evaluation" 
ON public.evaluations 
FOR UPDATE 
USING (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));