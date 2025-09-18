-- Add "Preceptor/a" position selection to existing imported inscriptions
-- This script adds the default position to inscriptions that don't have any position selections

-- First, ensure the "Preceptor/a" position exists
INSERT INTO public.positions (id, name, description, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Preceptor/a',
  'Cargo de preceptor/a para evaluaciones importadas',
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.positions WHERE name = 'Preceptor/a'
);

-- Get the Preceptor/a position ID
WITH preceptor_position AS (
  SELECT id FROM public.positions WHERE name = 'Preceptor/a' LIMIT 1
)
-- Add position selection to inscriptions that don't have any position selections
INSERT INTO public.inscription_position_selections (id, inscription_id, position_id, priority, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  i.id,
  pp.id,
  1,
  now(),
  now()
FROM public.inscriptions i
CROSS JOIN preceptor_position pp
WHERE i.teaching_level = 'secundario'
  AND NOT EXISTS (
    SELECT 1 FROM public.inscription_position_selections ips 
    WHERE ips.inscription_id = i.id
  );

-- Update existing evaluations to associate them with the Preceptor/a position selection
WITH preceptor_selections AS (
  SELECT 
    ips.id as position_selection_id,
    ips.inscription_id
  FROM public.inscription_position_selections ips
  INNER JOIN public.positions p ON ips.position_id = p.id
  WHERE p.name = 'Preceptor/a'
)
UPDATE public.evaluations 
SET position_selection_id = ps.position_selection_id
FROM preceptor_selections ps
WHERE evaluations.inscription_id = ps.inscription_id
  AND evaluations.position_selection_id IS NULL
  AND evaluations.subject_selection_id IS NULL;

