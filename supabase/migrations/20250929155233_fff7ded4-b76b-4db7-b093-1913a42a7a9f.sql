-- Add AYUDANTE TÉCNICO DE TRABAJOS PRÁCTICOS position to ENET nro 1
INSERT INTO public.administrative_positions (name, school_id, is_active)
SELECT 
  'AYUDANTE TÉCNICO DE TRABAJOS PRÁCTICOS',
  s.id,
  true
FROM public.schools s
WHERE s.name = 'ENET nro 1';