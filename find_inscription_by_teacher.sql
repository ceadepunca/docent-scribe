-- Script para encontrar la inscripción por los datos del docente
-- Basándonos en la información del evaluador Jorge Rubén Diaz

-- ========================================
-- BUSCAR INSCRIPCIÓN POR DOCENTE
-- ========================================

-- 1. Buscar inscripciones del docente evaluado (no del evaluador)
-- Necesitamos encontrar qué docente tiene la evaluación con los puntajes
SELECT '=== INSCRIPCIONES CON EVALUACIONES CON PUNTAJES ===' as info;
SELECT 
  i.id as inscription_id,
  i.user_id as teacher_id,
  p.first_name,
  p.last_name,
  p.dni,
  p.email as teacher_email,
  i.teaching_level,
  i.status as inscription_status,
  e.id as evaluation_id,
  e.titulo_score,
  e.total_score,
  e.evaluator_id,
  evaluator.first_name as evaluator_first_name,
  evaluator.last_name as evaluator_last_name
FROM public.inscriptions i
INNER JOIN public.profiles p ON i.user_id = p.id
INNER JOIN public.evaluations e ON i.id = e.inscription_id
INNER JOIN public.profiles evaluator ON e.evaluator_id = evaluator.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0)
  AND evaluator.first_name = 'Jorge Rubén'
  AND evaluator.last_name = 'Diaz'
ORDER BY e.created_at DESC;

-- 2. Buscar todas las inscripciones secundarias con evaluaciones
SELECT '=== TODAS LAS INSCRIPCIONES SECUNDARIAS CON EVALUACIONES ===' as info;
SELECT 
  i.id as inscription_id,
  p.first_name,
  p.last_name,
  p.dni,
  p.email,
  i.teaching_level,
  i.status,
  COUNT(e.id) as evaluation_count,
  MAX(e.titulo_score) as max_titulo_score,
  MAX(e.total_score) as max_total_score
FROM public.inscriptions i
INNER JOIN public.profiles p ON i.user_id = p.id
LEFT JOIN public.evaluations e ON i.id = e.inscription_id
WHERE i.teaching_level = 'secundario'
GROUP BY i.id, p.first_name, p.last_name, p.dni, p.email, i.teaching_level, i.status
HAVING COUNT(e.id) > 0
ORDER BY max_total_score DESC
LIMIT 10;

-- 3. Buscar específicamente la inscripción con la evaluación que encontramos
SELECT '=== INSCRIPCIÓN ESPECÍFICA CON LA EVALUACIÓN ===' as info;
SELECT 
  i.id as inscription_id,
  p.first_name,
  p.last_name,
  p.dni,
  p.email,
  i.teaching_level,
  i.status,
  e.id as evaluation_id,
  e.titulo_score,
  e.total_score,
  e.evaluator_id,
  evaluator.first_name as evaluator_first_name,
  evaluator.last_name as evaluator_last_name
FROM public.inscriptions i
INNER JOIN public.profiles p ON i.user_id = p.id
INNER JOIN public.evaluations e ON i.id = e.inscription_id
INNER JOIN public.profiles evaluator ON e.evaluator_id = evaluator.id
WHERE e.id = '2f368fed-6e4c-4b03-aecc-90f69cdc40d7';
