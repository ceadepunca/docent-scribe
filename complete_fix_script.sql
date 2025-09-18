-- Script COMPLETO para corregir todo el sistema de evaluaciones importadas
-- Ejecutar este script en Supabase Dashboard → SQL Editor

-- ========================================
-- PASO 1: Verificar estado actual
-- ========================================
SELECT '=== ESTADO ACTUAL ===' as info;

SELECT 
  'Evaluaciones totales' as tipo,
  COUNT(*) as total
FROM public.evaluations

UNION ALL

SELECT 
  'Evaluaciones sin asociación' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL

UNION ALL

SELECT 
  'Inscripciones secundarias' as tipo,
  COUNT(*) as total
FROM public.inscriptions 
WHERE teaching_level = 'secundario'

UNION ALL

SELECT 
  'Selecciones de cargo PRECEPTOR/A' as tipo,
  COUNT(*) as total
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE ap.name = 'PRECEPTOR/A';

-- ========================================
-- PASO 2: Asegurar que existe el cargo PRECEPTOR/A en Fray M Esquiú
-- ========================================
SELECT '=== CREANDO CARGO PRECEPTOR/A ===' as info;

-- Crear el cargo PRECEPTOR/A en la escuela Fray M Esquiú si no existe
INSERT INTO public.administrative_positions (id, name, school_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'PRECEPTOR/A',
  s.id,
  true,
  now(),
  now()
FROM public.schools s
WHERE s.name = 'Fray M Esquiú'
  AND NOT EXISTS (
    SELECT 1 FROM public.administrative_positions ap 
    WHERE ap.name = 'PRECEPTOR/A' AND ap.school_id = s.id
  );

-- ========================================
-- PASO 3: Crear selecciones de cargo para inscripciones que no las tengan
-- ========================================
SELECT '=== CREANDO SELECCIONES DE CARGO ===' as info;

-- Agregar selección de cargo PRECEPTOR/A a todas las inscripciones secundarias que no la tengan
WITH preceptor_position AS (
  SELECT ap.id, ap.school_id
  FROM public.administrative_positions ap
  INNER JOIN public.schools s ON ap.school_id = s.id
  WHERE ap.name = 'PRECEPTOR/A' AND s.name = 'Fray M Esquiú'
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

-- ========================================
-- PASO 4: Asociar evaluaciones existentes con selecciones de cargo
-- ========================================
SELECT '=== ASOCIANDO EVALUACIONES ===' as info;

-- Asociar evaluaciones con selecciones de cargo PRECEPTOR/A
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

-- ========================================
-- PASO 5: Corregir estados de inscripciones
-- ========================================
SELECT '=== CORRIGIENDO ESTADOS ===' as info;

-- Corregir el estado de las inscripciones importadas
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE status = 'draft' 
  AND teaching_level = 'secundario'
  AND created_at > '2024-01-01'::timestamp;

-- Asegurar que las inscripciones con evaluaciones estén en estado 'submitted'
UPDATE public.inscriptions 
SET status = 'submitted'
WHERE id IN (
  SELECT DISTINCT inscription_id 
  FROM public.evaluations 
  WHERE inscription_id IS NOT NULL
)
AND status NOT IN ('approved', 'rejected');

-- ========================================
-- PASO 6: Verificar resultados finales
-- ========================================
SELECT '=== RESULTADOS FINALES ===' as info;

SELECT 
  'Evaluaciones asociadas' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NOT NULL

UNION ALL

SELECT 
  'Evaluaciones sin asociar' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL

UNION ALL

SELECT 
  'Inscripciones con cargo PRECEPTOR/A' as tipo,
  COUNT(*) as total
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE i.teaching_level = 'secundario' AND ap.name = 'PRECEPTOR/A'

UNION ALL

SELECT 
  'Inscripciones en estado submitted' as tipo,
  COUNT(*) as total
FROM public.inscriptions 
WHERE status = 'submitted' AND teaching_level = 'secundario';

-- ========================================
-- PASO 7: Mostrar ejemplos de evaluaciones corregidas
-- ========================================
SELECT '=== EJEMPLOS DE EVALUACIONES CORREGIDAS ===' as info;

SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.titulo_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name,
  e.position_selection_id
FROM public.evaluations e
INNER JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A'
LIMIT 5;
