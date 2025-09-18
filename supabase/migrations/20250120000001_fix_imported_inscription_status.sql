-- Fix status of imported inscriptions to make them editable
-- Imported inscriptions should be in 'submitted' status, not 'draft' or 'completed'

-- Update imported inscriptions to 'submitted' status if they are in 'draft' status
-- This allows evaluators to see and edit them properly
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE status = 'draft' 
  AND teaching_level = 'secundario'
  AND created_at > '2024-01-01'::timestamp; -- Only recent inscriptions (imported ones)

-- Also ensure that any inscriptions with evaluations are in 'submitted' status
-- This handles cases where inscriptions might have been marked as 'completed' incorrectly
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE id IN (
  SELECT DISTINCT inscription_id 
  FROM public.evaluations 
  WHERE inscription_id IS NOT NULL
)
AND status NOT IN ('approved', 'rejected'); -- Don't change approved/rejected inscriptions

-- Add a comment to track this change
COMMENT ON TABLE public.inscriptions IS 'Inscriptions table - imported inscriptions should be in submitted status for evaluation';
