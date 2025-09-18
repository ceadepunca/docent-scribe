-- Script para corregir inscripciones importadas
-- Ejecutar este script directamente en la base de datos

-- 1. Asegurar que existe el cargo "Preceptor/a"
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

-- 2. Agregar selección de cargo Preceptor/a a todas las inscripciones secundarias que no la tengan
WITH preceptor_position AS (
  SELECT id FROM public.positions WHERE name = 'Preceptor/a' LIMIT 1
)
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

-- 3. Asociar evaluaciones existentes con la selección de cargo Preceptor/a
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

-- 4. Corregir el estado de las inscripciones importadas
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE status = 'draft' 
  AND teaching_level = 'secundario'
  AND created_at > '2024-01-01'::timestamp;

-- 5. Asegurar que las inscripciones con evaluaciones estén en estado 'submitted'
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE id IN (
  SELECT DISTINCT inscription_id 
  FROM public.evaluations 
  WHERE inscription_id IS NOT NULL
)
AND status NOT IN ('approved', 'rejected');

-- 6. Verificar resultados
SELECT 
  'Inscripciones secundarias' as tipo,
  COUNT(*) as total
FROM public.inscriptions 
WHERE teaching_level = 'secundario'

UNION ALL

SELECT 
  'Con cargo Preceptor/a' as tipo,
  COUNT(*) as total
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.positions p ON ips.position_id = p.id
WHERE i.teaching_level = 'secundario' AND p.name = 'Preceptor/a'

UNION ALL

SELECT 
  'Con evaluaciones' as tipo,
  COUNT(DISTINCT inscription_id) as total
FROM public.evaluations

UNION ALL

SELECT 
  'En estado submitted' as tipo,
  COUNT(*) as total
FROM public.inscriptions 
WHERE status = 'submitted' AND teaching_level = 'secundario';
