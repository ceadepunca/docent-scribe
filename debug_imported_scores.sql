-- Script de diagnóstico para investigar por qué los puntajes importados no se muestran
-- Ejecutar este script para entender el estado actual de los puntajes importados

-- ========================================
-- DIAGNÓSTICO DE PUNTAJES IMPORTADOS
-- ========================================

-- 1. Verificar evaluaciones con puntajes (como vimos en la imagen)
SELECT '=== EVALUACIONES CON PUNTAJES ===' as info;
SELECT 
  e.id,
  e.inscription_id,
  e.evaluator_id,
  e.titulo_score,
  e.antiguedad_titulo_score,
  e.antiguedad_docente_score,
  e.concepto_score,
  e.total_score,
  e.position_selection_id,
  e.subject_selection_id,
  e.status,
  e.created_at,
  e.updated_at
FROM public.evaluations e
WHERE e.titulo_score > 0 OR e.total_score > 0
ORDER BY e.created_at DESC
LIMIT 10;

-- 2. Verificar inscripciones secundarias con evaluaciones
SELECT '=== INSCRIPCIONES SECUNDARIAS CON EVALUACIONES ===' as info;
SELECT 
  i.id as inscription_id,
  i.teaching_level,
  i.status as inscription_status,
  COUNT(e.id) as evaluation_count,
  COUNT(CASE WHEN e.titulo_score > 0 THEN 1 END) as evaluations_with_scores
FROM public.inscriptions i
LEFT JOIN public.evaluations e ON i.id = e.inscription_id
WHERE i.teaching_level = 'secundario'
GROUP BY i.id, i.teaching_level, i.status
HAVING COUNT(e.id) > 0
ORDER BY evaluation_count DESC
LIMIT 10;

-- 3. Verificar asociaciones entre evaluaciones y selecciones de cargo
SELECT '=== ASOCIACIONES EVALUACIÓN-CARGO ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  ips.id as position_selection_id_from_inscription,
  ap.name as position_name,
  s.name as school_name
FROM public.evaluations e
LEFT JOIN public.inscriptions i ON e.inscription_id = i.id
LEFT JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
LEFT JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;

-- 4. Verificar si hay discrepancias en las asociaciones
SELECT '=== DISCREPANCIAS EN ASOCIACIONES ===' as info;
SELECT 
  COUNT(*) as total_evaluations_with_scores,
  COUNT(CASE WHEN e.position_selection_id IS NOT NULL THEN 1 END) as with_position_selection_id,
  COUNT(CASE WHEN e.position_selection_id IS NULL THEN 1 END) as without_position_selection_id,
  COUNT(CASE WHEN e.position_selection_id != ips.id THEN 1 END) as mismatched_associations
FROM public.evaluations e
LEFT JOIN public.inscriptions i ON e.inscription_id = i.id
LEFT JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0);

-- 5. Verificar evaluaciones específicas de PRECEPTOR/A
SELECT '=== EVALUACIONES PRECEPTOR/A ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name,
  CASE 
    WHEN e.position_selection_id = ips.id THEN 'Asociación correcta'
    ELSE 'Asociación incorrecta'
  END as association_status
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;

-- 6. Verificar el estado de las evaluaciones por evaluador
SELECT '=== EVALUACIONES POR EVALUADOR ===' as info;
SELECT 
  e.evaluator_id,
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN e.titulo_score > 0 THEN 1 END) as with_scores,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN e.status = 'draft' THEN 1 END) as draft,
  ROUND(AVG(e.total_score), 2) as avg_total_score
FROM public.evaluations e
WHERE e.titulo_score > 0 OR e.total_score > 0
GROUP BY e.evaluator_id
ORDER BY total_evaluations DESC;
