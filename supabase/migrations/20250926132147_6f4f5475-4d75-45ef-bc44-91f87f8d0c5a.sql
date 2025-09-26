-- Remove duplicate PRECEPTOR/A position from Fray M Esquiú (keeping the first one)
DELETE FROM public.administrative_positions 
WHERE id = '90cdc1d0-a488-40ad-9e75-7c8325efb975';

-- Add missing LEGISLACIÓN DEL TRABAJO subject to ENET nro 1 electromecanica specialty
INSERT INTO public.subjects (name, school_id, specialty, is_active)
SELECT 
  'LEGISLACIÓN DEL TRABAJO',
  s.id,
  'electromecanica',
  true
FROM public.schools s
WHERE s.name = 'ENET nro 1';