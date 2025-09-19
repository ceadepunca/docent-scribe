-- Script para verificar evaluaciones importadas específicamente
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Buscar todas las evaluaciones que tienen puntajes (no son 0)
SELECT 
    'Evaluations with Scores' as info,
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
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
AND (
    e.titulo_score > 0 OR
    e.antiguedad_titulo_score > 0 OR
    e.antiguedad_docente_score > 0 OR
    e.concepto_score > 0 OR
    e.promedio_titulo_score > 0 OR
    e.trabajo_publico_score > 0 OR
    e.becas_otros_score > 0 OR
    e.concurso_score > 0 OR
    e.otros_antecedentes_score > 0 OR
    e.red_federal_score > 0
)
ORDER BY e.created_at DESC;

-- 2. Verificar si hay evaluaciones con total_score > 0
SELECT 
    'Evaluations with Total Score' as info,
    e.id,
    e.inscription_id,
    e.total_score,
    e.status,
    e.created_at,
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
AND e.total_score > 0
ORDER BY e.created_at DESC;

-- 3. Verificar todas las evaluaciones (incluyendo las que tienen 0)
SELECT 
    'All Evaluations (including zeros)' as info,
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
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
ORDER BY e.created_at DESC;

-- 4. Verificar si hay evaluaciones importadas (creadas por el proceso de importación)
SELECT 
    'Imported Evaluations' as info,
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
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
AND e.created_at < '2025-01-20'  -- Evaluaciones creadas antes de hoy (probablemente importadas)
ORDER BY e.created_at DESC;
