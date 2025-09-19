-- Script para verificar evaluaciones importadas de otros docentes
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar cuántas evaluaciones importadas hay en total
SELECT 
    'Total Imported Evaluations' as info,
    COUNT(*) as total_count
FROM evaluations e
WHERE (
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
);

-- 2. Verificar algunos ejemplos de evaluaciones importadas
SELECT 
    'Sample Imported Evaluations' as info,
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
WHERE (
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
ORDER BY e.created_at DESC
LIMIT 5;

-- 3. Verificar si hay evaluaciones para inscripciones con PRECEPTOR/A
SELECT 
    'Evaluations with PRECEPTOR/A Position' as info,
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
WHERE e.position_selection_id IN (
    SELECT ips.id 
    FROM inscription_position_selections ips
    JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
    WHERE ap.name = 'PRECEPTOR/A'
)
ORDER BY e.created_at DESC
LIMIT 5;
