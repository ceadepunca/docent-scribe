-- Script para verificar la evaluación de BRANDAN
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Buscar a BRANDAN en la tabla profiles
SELECT
    'BRANDAN Profile' as info,
    p.id,
    p.first_name,
    p.last_name,
    p.dni
FROM profiles p
WHERE p.first_name ILIKE '%BRANDAN%' OR p.last_name ILIKE '%BRANDAN%'
ORDER BY p.created_at DESC;

-- 2. Buscar inscripciones de BRANDAN
SELECT
    'BRANDAN Inscriptions' as info,
    i.id as inscription_id,
    i.user_id,
    i.status as inscription_status,
    p.first_name,
    p.last_name
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE p.first_name ILIKE '%BRANDAN%' OR p.last_name ILIKE '%BRANDAN%'
ORDER BY i.created_at DESC;

-- 3. Buscar evaluaciones de BRANDAN
SELECT
    'BRANDAN Evaluations' as info,
    e.id,
    e.inscription_id,
    e.evaluator_id,
    e.position_selection_id,
    e.subject_selection_id,
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
    e.status,
    e.created_at,
    e.updated_at,
    p_evaluator.first_name as evaluator_name,
    p_evaluator.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p_evaluator ON e.evaluator_id = p_evaluator.id
WHERE e.inscription_id IN (
    SELECT i.id 
    FROM inscriptions i
    JOIN profiles p ON i.user_id = p.id
    WHERE p.first_name ILIKE '%BRANDAN%' OR p.last_name ILIKE '%BRANDAN%'
)
ORDER BY e.updated_at DESC;
