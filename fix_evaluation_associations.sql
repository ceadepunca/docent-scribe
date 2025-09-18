-- Script para verificar y corregir la asociación entre evaluaciones y selecciones de cargo

-- 1. Verificar el estado actual
SELECT 
  'Evaluaciones sin position_selection_id' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL

UNION ALL

SELECT 
  'Evaluaciones con position_selection_id' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NOT NULL

UNION ALL

SELECT 
  'Selecciones de cargo PRECEPTOR/A' as tipo,
  COUNT(*) as total
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE ap.name = 'PRECEPTOR/A';

-- 2. Verificar qué evaluaciones están desasociadas
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.titulo_score,
  e.total_score,
  i.teaching_level,
  e.position_selection_id,
  e.subject_selection_id
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE e.position_selection_id IS NULL 
  AND e.subject_selection_id IS NULL
  AND i.teaching_level = 'secundario'
LIMIT 10;

-- 3. Asociar evaluaciones con selecciones de cargo PRECEPTOR/A
-- Para cada evaluación sin asociación, buscar la selección de cargo correspondiente
WITH evaluation_updates AS (
  SELECT 
    e.id as evaluation_id,
    ips.id as position_selection_id
  FROM public.evaluations e
  INNER JOIN public.inscriptions i ON e.inscription_id = i.id
  INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
  INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
  WHERE e.position_selection_id IS NULL 
    AND e.subject_selection_id IS NULL
    AND i.teaching_level = 'secundario'
    AND ap.name = 'PRECEPTOR/A'
)
UPDATE public.evaluations 
SET position_selection_id = eu.position_selection_id
FROM evaluation_updates eu
WHERE evaluations.id = eu.evaluation_id;

-- 4. Verificar resultados después de la corrección
SELECT 
  'Evaluaciones corregidas' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NOT NULL

UNION ALL

SELECT 
  'Evaluaciones aún sin asociar' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL;

-- 5. Mostrar algunas evaluaciones corregidas como ejemplo
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.titulo_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name
FROM public.evaluations e
INNER JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A'
LIMIT 5;
