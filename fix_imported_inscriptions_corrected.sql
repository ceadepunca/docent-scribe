-- Script CORREGIDO para arreglar inscripciones importadas
-- Estructura correcta: administrative_positions (no positions)

-- 1. Verificar que existe el cargo "PRECEPTOR/A" en la escuela Fray M Esquiú
-- Primero necesitamos el ID de la escuela Fray M Esquiú
SELECT id, name FROM public.schools WHERE name LIKE '%Fray%' OR name LIKE '%Esquiú%';

-- 2. Asegurar que existe el cargo "PRECEPTOR/A" en la escuela Fray M Esquiú
-- (Reemplaza 'SCHOOL_ID_AQUI' con el ID real de la escuela)
INSERT INTO public.administrative_positions (id, name, school_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'PRECEPTOR/A',
  s.id,
  true,
  now(),
  now()
FROM public.schools s
WHERE s.name LIKE '%Fray%' OR s.name LIKE '%Esquiú%'
  AND NOT EXISTS (
    SELECT 1 FROM public.administrative_positions ap 
    WHERE ap.name = 'PRECEPTOR/A' AND ap.school_id = s.id
  );

-- 3. Agregar selección de cargo PRECEPTOR/A a todas las inscripciones secundarias que no la tengan
WITH preceptor_position AS (
  SELECT ap.id, ap.school_id
  FROM public.administrative_positions ap
  INNER JOIN public.schools s ON ap.school_id = s.id
  WHERE ap.name = 'PRECEPTOR/A' 
    AND (s.name LIKE '%Fray%' OR s.name LIKE '%Esquiú%')
  LIMIT 1
)
INSERT INTO public.inscription_position_selections (id, inscription_id, administrative_position_id, created_at)
SELECT 
  gen_random_uuid(),
  i.id,
  pp.id,
  now()
FROM public.inscriptions i
CROSS JOIN preceptor_position pp
WHERE i.teaching_level = 'secundario'
  AND NOT EXISTS (
    SELECT 1 FROM public.inscription_position_selections ips 
    WHERE ips.inscription_id = i.id
  );

-- 4. Asociar evaluaciones existentes con la selección de cargo PRECEPTOR/A
WITH preceptor_selections AS (
  SELECT 
    ips.id as position_selection_id,
    ips.inscription_id
  FROM public.inscription_position_selections ips
  INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
  WHERE ap.name = 'PRECEPTOR/A'
)
UPDATE public.evaluations 
SET position_selection_id = ps.position_selection_id
FROM preceptor_selections ps
WHERE evaluations.inscription_id = ps.inscription_id
  AND evaluations.position_selection_id IS NULL
  AND evaluations.subject_selection_id IS NULL;

-- 5. Corregir el estado de las inscripciones importadas
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE status = 'draft' 
  AND teaching_level = 'secundario'
  AND created_at > '2024-01-01'::timestamp;

-- 6. Asegurar que las inscripciones con evaluaciones estén en estado 'submitted'
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE id IN (
  SELECT DISTINCT inscription_id 
  FROM public.evaluations 
  WHERE inscription_id IS NOT NULL
)
AND status NOT IN ('approved', 'rejected');

-- 7. Verificar resultados
SELECT 
  'Escuelas con PRECEPTOR/A' as tipo,
  COUNT(DISTINCT ap.school_id) as total
FROM public.administrative_positions ap
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A' AND (s.name LIKE '%Fray%' OR s.name LIKE '%Esquiú%')

UNION ALL

SELECT 
  'Inscripciones secundarias' as tipo,
  COUNT(*) as total
FROM public.inscriptions 
WHERE teaching_level = 'secundario'

UNION ALL

SELECT 
  'Con cargo PRECEPTOR/A' as tipo,
  COUNT(*) as total
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE i.teaching_level = 'secundario' AND ap.name = 'PRECEPTOR/A'

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
