-- Script para verificar el evaluator_id de la evaluación
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el evaluator_id de la evaluación de ISAAC
SELECT
    'ISAAC Evaluation Evaluator' as info,
    e.id,
    e.evaluator_id,
    e.titulo_score,
    e.total_score,
    e.updated_at,
    p_evaluator.first_name as evaluator_name,
    p_evaluator.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p_evaluator ON e.evaluator_id = p_evaluator.id
WHERE e.id = '91f8fd18-e912-4793-a7bb-36db0430d707';

-- 2. Verificar quién es el usuario actual (el que está logueado)
-- Esto lo necesitamos para comparar con el evaluator_id
SELECT
    'Current User Check' as info,
    'Necesitamos verificar quién es el usuario actual en el frontend' as message;
