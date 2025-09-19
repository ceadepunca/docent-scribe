-- Script de verificación para confirmar que las evaluaciones se pueden editar correctamente
-- Ejecutar este script para verificar el estado de las evaluaciones

-- ========================================
-- VERIFICACIÓN DE EVALUACIONES EDITABLES
-- ========================================

-- 1. Verificar evaluaciones completadas que deberían ser editables
SELECT '=== EVALUACIONES COMPLETADAS ===' as info;
SELECT 
  COUNT(*) as total_completed_evaluations,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as with_total_score,
  COUNT(CASE WHEN total_score IS NULL OR total_score = 0 THEN 1 END) as missing_total_score
FROM public.evaluations 
WHERE status = 'completed';

-- 2. Verificar evaluaciones por evaluador
SELECT '=== EVALUACIONES POR EVALUADOR ===' as info;
SELECT 
  e.evaluator_id,
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_evaluations,
  COUNT(CASE WHEN e.status = 'draft' THEN 1 END) as draft_evaluations,
  ROUND(AVG(e.total_score), 2) as average_total_score
FROM public.evaluations e
GROUP BY e.evaluator_id
ORDER BY total_evaluations DESC;

-- 3. Verificar evaluaciones recientes (últimas 24 horas)
SELECT '=== EVALUACIONES RECIENTES ===' as info;
SELECT 
  COUNT(*) as recent_evaluations,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as recent_completed,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as recent_draft,
  ROUND(AVG(total_score), 2) as average_total_score
FROM public.evaluations 
WHERE updated_at >= NOW() - INTERVAL '24 hours';

-- 4. Mostrar ejemplos de evaluaciones completadas
SELECT '=== EJEMPLOS DE EVALUACIONES COMPLETADAS ===' as info;
SELECT 
  e.id,
  e.inscription_id,
  e.evaluator_id,
  e.status,
  e.total_score,
  e.titulo_score,
  e.antiguedad_titulo_score,
  e.concepto_score,
  e.updated_at,
  i.teaching_level,
  -- Verificar si tiene selecciones de cargo
  CASE 
    WHEN e.position_selection_id IS NOT NULL THEN 'Con cargo'
    WHEN e.subject_selection_id IS NOT NULL THEN 'Con materia'
    ELSE 'Sin selección específica'
  END as selection_type
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE e.status = 'completed'
ORDER BY e.updated_at DESC
LIMIT 5;

-- 5. Verificar que las evaluaciones tienen las asociaciones correctas
SELECT '=== VERIFICACIÓN DE ASOCIACIONES ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN position_selection_id IS NOT NULL THEN 1 END) as with_position_selection,
  COUNT(CASE WHEN subject_selection_id IS NOT NULL THEN 1 END) as with_subject_selection,
  COUNT(CASE WHEN position_selection_id IS NULL AND subject_selection_id IS NULL THEN 1 END) as without_specific_selection
FROM public.evaluations;

-- 6. Verificar evaluaciones de nivel secundario con cargos PRECEPTOR/A
SELECT '=== EVALUACIONES SECUNDARIO CON PRECEPTOR/A ===' as info;
SELECT 
  COUNT(*) as preceptor_evaluations,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed_preceptor_evaluations,
  ROUND(AVG(e.total_score), 2) as average_preceptor_score
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE i.teaching_level = 'secundario' 
  AND ap.name = 'PRECEPTOR/A';
