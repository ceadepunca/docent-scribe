-- Script para verificar si las evaluaciones se están actualizando correctamente
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar evaluaciones recientes (últimas 2 horas)
SELECT
    'Recent Evaluations' as info,
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
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.updated_at >= NOW() - INTERVAL '2 hours'
ORDER BY e.updated_at DESC;

-- 2. Verificar evaluaciones con puntajes (posiblemente importadas)
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
    e.updated_at,
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE 
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
ORDER BY e.updated_at DESC;

-- 3. Verificar evaluaciones con posición PRECEPTOR/A
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
    e.updated_at,
    p_evaluator.first_name as evaluator_name,
    p_evaluator.last_name as evaluator_lastname,
    ap.name as position_name,
    s.name as school_name
FROM evaluations e
JOIN inscription_position_selections ips ON e.position_selection_id = ips.id
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools s ON ap.school_id = s.id
LEFT JOIN profiles p_evaluator ON e.evaluator_id = p_evaluator.id
WHERE ap.name = 'PRECEPTOR/A' AND s.name = 'Fray M Esquiú'
ORDER BY e.updated_at DESC;

-- 4. Verificar si las evaluaciones tienen los IDs correctos de selección
SELECT
    'Evaluation Selection IDs Check' as info,
    e.id as evaluation_id,
    e.inscription_id,
    e.position_selection_id,
    e.subject_selection_id,
    ips.id as position_selection_exists,
    iss.id as subject_selection_exists,
    ap.name as position_name,
    sub.name as subject_name
FROM evaluations e
LEFT JOIN inscription_position_selections ips ON e.position_selection_id = ips.id
LEFT JOIN inscription_subject_selections iss ON e.subject_selection_id = iss.id
LEFT JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN subjects sub ON iss.subject_id = sub.id
WHERE e.updated_at >= NOW() - INTERVAL '2 hours'
ORDER BY e.updated_at DESC;
