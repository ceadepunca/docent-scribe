-- Script para verificar una evaluación específica y sus asociaciones
-- Usar los IDs de la evaluación que mostraste

-- ========================================
-- VERIFICACIÓN DE EVALUACIÓN ESPECÍFICA
-- ========================================

-- 1. Verificar la evaluación específica
SELECT '=== EVALUACIÓN ESPECÍFICA ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.evaluator_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.antiguedad_titulo_score,
  e.antiguedad_docente_score,
  e.concepto_score,
  e.total_score,
  e.status,
  e.created_at,
  e.updated_at
FROM public.evaluations e
WHERE e.id = '2f368fed-6e4c-4b03-aecc-90f69cdc40d7';

-- 2. Verificar la inscripción asociada
SELECT '=== INSCRIPCIÓN ASOCIADA ===' as info;
SELECT 
  i.id as inscription_id,
  i.user_id,
  i.teaching_level,
  i.status as inscription_status,
  p.first_name,
  p.last_name,
  p.dni
FROM public.inscriptions i
LEFT JOIN public.profiles p ON i.user_id = p.id
WHERE i.id = 'bbbb0b4a-e71f-46ac-93f8-f65130842b66';

-- 3. Verificar la selección de cargo asociada
SELECT '=== SELECCIÓN DE CARGO ASOCIADA ===' as info;
SELECT 
  ips.id as position_selection_id,
  ips.inscription_id,
  ips.administrative_position_id,
  ap.name as position_name,
  s.name as school_name,
  s.id as school_id
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ips.id = '7cec79d4-155b-48d9-8783-d4ce091c3522';

-- 4. Verificar si hay otras evaluaciones para la misma inscripción
SELECT '=== OTRAS EVALUACIONES PARA LA MISMA INSCRIPCIÓN ===' as info;
SELECT 
  e.id as evaluation_id,
  e.evaluator_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  e.created_at
FROM public.evaluations e
WHERE e.inscription_id = 'bbbb0b4a-e71f-46ac-93f8-f65130842b66'
ORDER BY e.created_at DESC;

-- 5. Verificar el evaluador de la evaluación
SELECT '=== EVALUADOR ===' as info;
SELECT 
  p.id as evaluator_id,
  p.first_name,
  p.last_name,
  p.email
FROM public.profiles p
WHERE p.id = (
  SELECT e.evaluator_id 
  FROM public.evaluations e 
  WHERE e.id = '2f368fed-6e4c-4b03-aecc-90f69cdc40d7'
);
