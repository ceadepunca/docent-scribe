-- Add default "Preceptor/a" position for imported evaluations
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
