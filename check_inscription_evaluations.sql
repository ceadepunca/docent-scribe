-- Script para verificar si una inscripción específica tiene evaluaciones
-- Usar los IDs de la nueva inscripción que estás probando

-- ========================================
-- VERIFICAR EVALUACIONES DE INSCRIPCIÓN
-- ========================================

-- 1. Verificar si hay evaluaciones para la inscripción específica
SELECT '=== EVALUACIONES PARA LA INSCRIPCIÓN ===' as info;
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
  p.first_name as evaluator_first_name,
  p.last_name as evaluator_last_name
FROM public.evaluations e
LEFT JOIN public.profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
ORDER BY e.created_at DESC;

-- 2. Verificar la inscripción y sus selecciones
SELECT '=== INSCRIPCIÓN Y SUS SELECCIONES ===' as info;
SELECT 
  i.id as inscription_id,
  i.user_id,
  i.teaching_level,
  i.status as inscription_status,
  p.first_name,
  p.last_name,
  p.dni,
  COUNT(ips.id) as position_selections_count,
  COUNT(iss.id) as subject_selections_count
FROM public.inscriptions i
LEFT JOIN public.profiles p ON i.user_id = p.id
LEFT JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
LEFT JOIN public.inscription_subject_selections iss ON i.id = iss.inscription_id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
GROUP BY i.id, i.user_id, i.teaching_level, i.status, p.first_name, p.last_name, p.dni;

-- 3. Verificar las selecciones de cargo específicas
SELECT '=== SELECCIONES DE CARGO ===' as info;
SELECT 
  ips.id as position_selection_id,
  ips.inscription_id,
  ips.administrative_position_id,
  ap.name as position_name,
  s.name as school_name
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 4. Verificar si hay evaluaciones para el position_selection_id específico
SELECT '=== EVALUACIONES PARA EL POSITION_SELECTION_ID ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  e.created_at
FROM public.evaluations e
WHERE e.position_selection_id = 'a3748aa1-e0b3-4d2c-8be5-50632c233c9c';

-- 5. Verificar todas las evaluaciones con puntajes para inscripciones secundarias
SELECT '=== TODAS LAS EVALUACIONES CON PUNTAJES (SECUNDARIO) ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  p.first_name,
  p.last_name,
  p.dni
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.profiles p ON i.user_id = p.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;
