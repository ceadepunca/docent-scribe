-- Script de diagnóstico para ver qué está pasando con los puntajes
-- Ejecutar este script para entender el problema

-- 1. Verificar si existen evaluaciones con puntajes
SELECT '=== EVALUACIONES CON PUNTAJES ===' as info;

SELECT 
  e.id,
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
  e.position_selection_id,
  e.subject_selection_id
FROM public.evaluations e
WHERE e.titulo_score > 0 OR e.total_score > 0
LIMIT 5;

-- 2. Verificar las inscripciones y sus selecciones de cargo
SELECT '=== INSCRIPCIONES Y SELECCIONES ===' as info;

SELECT 
  i.id as inscription_id,
  i.teaching_level,
  i.status,
  ips.id as position_selection_id,
  ap.name as position_name,
  s.name as school_name
FROM public.inscriptions i
LEFT JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
LEFT JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
LIMIT 5;

-- 3. Verificar la asociación entre evaluaciones y selecciones
SELECT '=== ASOCIACIONES EVALUACIONES-SELECCIONES ===' as info;

SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  ips.id as actual_position_selection_id,
  ap.name as position_name
FROM public.evaluations e
LEFT JOIN public.inscriptions i ON e.inscription_id = i.id
LEFT JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
LEFT JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE i.teaching_level = 'secundario'
LIMIT 5;

-- 4. Verificar si hay evaluaciones sin asociación
SELECT '=== EVALUACIONES SIN ASOCIACIÓN ===' as info;

SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score
FROM public.evaluations e
WHERE e.position_selection_id IS NULL 
  AND e.subject_selection_id IS NULL
  AND (e.titulo_score > 0 OR e.total_score > 0)
LIMIT 5;

-- 5. Verificar si existen selecciones de cargo PRECEPTOR/A
SELECT '=== SELECCIONES PRECEPTOR/A ===' as info;

SELECT 
  ips.id,
  ips.inscription_id,
  ap.name as position_name,
  s.name as school_name
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A'
LIMIT 5;
