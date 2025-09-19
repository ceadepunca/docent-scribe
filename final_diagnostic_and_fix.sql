-- Script FINAL: Diagnóstico + Corrección
-- Ejecutar este script completo en Supabase Dashboard → SQL Editor

-- ========================================
-- PARTE 1: DIAGNÓSTICO
-- ========================================
SELECT '=== DIAGNÓSTICO INICIAL ===' as info;

-- Verificar evaluaciones con puntajes
SELECT 
  'Evaluaciones con puntajes' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE titulo_score > 0 OR total_score > 0;

-- Verificar evaluaciones sin asociación
SELECT 
  'Evaluaciones sin asociación' as tipo,
  COUNT(*) as total
FROM public.evaluations 
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL;

-- Verificar selecciones de cargo PRECEPTOR/A
SELECT 
  'Selecciones PRECEPTOR/A' as tipo,
  COUNT(*) as total
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE ap.name = 'PRECEPTOR/A';

-- Mostrar ejemplos de evaluaciones con puntajes
SELECT '=== EJEMPLOS DE EVALUACIONES CON PUNTAJES ===' as info;
SELECT 
  e.id,
  e.inscription_id,
  e.titulo_score,
  e.total_score,
  e.position_selection_id,
  e.subject_selection_id
FROM public.evaluations e
WHERE e.titulo_score > 0 OR e.total_score > 0
LIMIT 3;

-- ========================================
-- PARTE 2: CORRECCIÓN
-- ========================================
SELECT '=== APLICANDO CORRECCIONES ===' as info;

-- Asociar evaluaciones existentes con selecciones de cargo
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
-- PARTE 3: VERIFICACIÓN FINAL
-- ========================================
SELECT '=== VERIFICACIÓN FINAL ===' as info;

-- Verificar resultados después de la corrección
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
WHERE position_selection_id IS NULL AND subject_selection_id IS NULL;

-- Mostrar ejemplos de evaluaciones corregidas
SELECT '=== EJEMPLOS DE EVALUACIONES CORREGIDAS ===' as info;
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
LIMIT 3;
