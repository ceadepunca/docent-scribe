-- Script INTELIGENTE para corregir evaluaciones sin causar errores de duplicados
-- Este script verifica antes de crear/actualizar

-- ========================================
-- PASO 1: Asociar evaluaciones existentes con selecciones de cargo
-- ========================================
SELECT '=== ASOCIANDO EVALUACIONES EXISTENTES ===' as info;

-- Solo actualizar evaluaciones que NO tienen asociación
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

-- Mostrar cuántas evaluaciones se asociaron
SELECT 
  'Evaluaciones asociadas en este paso' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NOT NULL;

-- ========================================
-- PASO 2: Verificar el estado final
-- ========================================
SELECT '=== ESTADO FINAL ===' as info;

SELECT 
  'Evaluaciones con puntajes' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE titulo_score > 0 OR total_score > 0

UNION ALL

SELECT 
  'Evaluaciones asociadas a cargos' as tipo,
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
WHERE i.teaching_level = 'secundario' AND ap.name = 'PRECEPTOR/A';

-- ========================================
-- PASO 3: Mostrar ejemplos de evaluaciones que deberían aparecer
-- ========================================
SELECT '=== EJEMPLOS DE EVALUACIONES QUE DEBERÍAN APARECER ===' as info;

SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.titulo_score,
  e.antiguedad_titulo_score,
  e.antiguedad_docente_score,
  e.concepto_score,
  e.promedio_titulo_score,
  e.trabajo_publico_score,
  e.becas_otros_score,
  e.concurso_score,
  e.otros_antecedentes_score,
  e.red_federal_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name,
  e.position_selection_id
FROM public.evaluations e
INNER JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
LIMIT 5;
