-- Script para identificar y corregir evaluaciones duplicadas
-- El error indica que hay 2 evaluaciones para la misma combinación

-- ========================================
-- IDENTIFICAR EVALUACIONES DUPLICADAS
-- ========================================

-- 1. Verificar evaluaciones duplicadas para la inscripción específica
SELECT '=== EVALUACIONES DUPLICADAS PARA LA INSCRIPCIÓN ===' as info;
SELECT 
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  COUNT(*) as evaluation_count,
  STRING_AGG(e.id::text, ', ') as evaluation_ids,
  STRING_AGG(e.evaluator_id::text, ', ') as evaluator_ids,
  STRING_AGG(e.titulo_score::text, ', ') as titulo_scores,
  STRING_AGG(e.total_score::text, ', ') as total_scores,
  STRING_AGG(e.created_at::text, ', ') as created_dates
FROM public.evaluations e
WHERE e.inscription_id = 'bbbb0b4a-e71f-46ac-93f8-f65130842b66'
  AND e.position_selection_id = '7cec79d4-155b-48d9-8783-d4ce091c3522'
GROUP BY e.inscription_id, e.position_selection_id, e.subject_selection_id
HAVING COUNT(*) > 1;

-- 2. Ver todas las evaluaciones para esta inscripción
SELECT '=== TODAS LAS EVALUACIONES PARA ESTA INSCRIPCIÓN ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.evaluator_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  e.created_at,
  e.updated_at,
  p.first_name as evaluator_first_name,
  p.last_name as evaluator_last_name
FROM public.evaluations e
LEFT JOIN public.profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = 'bbbb0b4a-e71f-46ac-93f8-f65130842b66'
ORDER BY e.created_at DESC;

-- 3. Verificar si hay evaluaciones duplicadas en general
SELECT '=== EVALUACIONES DUPLICADAS EN GENERAL ===' as info;
SELECT 
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  COUNT(*) as duplicate_count
FROM public.evaluations e
WHERE e.position_selection_id IS NOT NULL
GROUP BY e.inscription_id, e.position_selection_id, e.subject_selection_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 4. Mostrar detalles de las evaluaciones duplicadas
SELECT '=== DETALLES DE EVALUACIONES DUPLICADAS ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.evaluator_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  e.created_at,
  p.first_name as evaluator_first_name,
  p.last_name as evaluator_last_name
FROM public.evaluations e
LEFT JOIN public.profiles p ON e.evaluator_id = p.id
WHERE (e.inscription_id, e.position_selection_id, e.subject_selection_id) IN (
  SELECT inscription_id, position_selection_id, subject_selection_id
  FROM public.evaluations
  WHERE position_selection_id IS NOT NULL
  GROUP BY inscription_id, position_selection_id, subject_selection_id
  HAVING COUNT(*) > 1
)
ORDER BY e.inscription_id, e.position_selection_id, e.created_at DESC;
