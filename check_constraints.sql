-- Script para investigar las restricciones de la tabla evaluations
-- Ejecutar este script para entender las reglas de validación

-- ========================================
-- INVESTIGACIÓN DE RESTRICCIONES
-- ========================================

-- 1. Ver las restricciones de la tabla evaluations
SELECT '=== RESTRICCIONES DE LA TABLA EVALUATIONS ===' as info;
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.evaluations'::regclass
  AND contype = 'c'; -- 'c' = check constraint

-- 2. Ver la estructura completa de la tabla evaluations
SELECT '=== ESTRUCTURA DE LA TABLA EVALUATIONS ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar el estado actual de las evaluaciones problemáticas
SELECT '=== EVALUACIONES CON PROBLEMAS DE RESTRICCIÓN ===' as info;
SELECT 
  e.id,
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  CASE 
    WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NOT NULL THEN 'AMBOS'
    WHEN e.position_selection_id IS NOT NULL THEN 'POSITION'
    WHEN e.subject_selection_id IS NOT NULL THEN 'SUBJECT'
    ELSE 'NINGUNO'
  END as selection_type,
  i.teaching_level
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;
