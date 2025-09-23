-- Script para probar la consulta exacta que hace el frontend
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Probar la consulta específica que hace ConsolidatedEvaluationGrid
SELECT
    'Frontend Query Test' as info,
    e.*
FROM evaluations e
WHERE e.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
  AND e.position_selection_id = '7db05802-21bf-4a3a-bf3a-58a1865ee27a'
ORDER BY e.created_at DESC
LIMIT 1;

-- 2. Probar la consulta de fallback (cualquier evaluación para la inscripción)
SELECT
    'Fallback Query Test' as info,
    e.*
FROM evaluations e
WHERE e.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
ORDER BY e.created_at DESC
LIMIT 1;

-- 3. Verificar si hay múltiples evaluaciones para la misma inscripción
SELECT
    'Multiple Evaluations Check' as info,
    COUNT(*) as total_evaluations,
    COUNT(DISTINCT position_selection_id) as unique_positions,
    COUNT(DISTINCT subject_selection_id) as unique_subjects
FROM evaluations e
WHERE e.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';