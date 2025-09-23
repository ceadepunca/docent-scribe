-- Script para diagnosticar evaluaciones importadas
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar evaluaciones importadas recientemente
SELECT
    'Recent Imported Evaluations' as info,
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
WHERE e.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY e.created_at DESC;

-- 2. Verificar evaluaciones con puntajes (posiblemente importadas)
SELECT
    'Evaluations with Scores' as info,
    COUNT(*) as total_evaluations_with_scores
FROM evaluations e
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
    e.red_federal_score > 0;

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
ORDER BY e.created_at DESC;

-- 4. Verificar inscripciones con evaluaciones
SELECT
    'Inscriptions with Evaluations' as info,
    i.id as inscription_id,
    i.user_id,
    i.status as inscription_status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.legajo,
    COUNT(e.id) as evaluation_count
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN evaluations e ON i.id = e.inscription_id
WHERE i.teaching_level = 'secundario'
GROUP BY i.id, i.user_id, i.status, i.teaching_level, p.first_name, p.last_name, p.legajo
HAVING COUNT(e.id) > 0
ORDER BY evaluation_count DESC;

-- 5. Verificar evaluaciones por evaluador
SELECT
    'Evaluations by Evaluator' as info,
    e.evaluator_id,
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname,
    COUNT(e.id) as evaluation_count,
    MIN(e.created_at) as first_evaluation,
    MAX(e.created_at) as last_evaluation
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
GROUP BY e.evaluator_id, p.first_name, p.last_name
ORDER BY evaluation_count DESC;
