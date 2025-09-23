-- Script para verificar por qué las evaluaciones no se muestran en la grilla
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar evaluaciones importadas con sus asociaciones
SELECT
    'Imported Evaluations with Associations' as info,
    e.id as evaluation_id,
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
    p_teacher.first_name as teacher_name,
    p_teacher.last_name as teacher_lastname,
    p_teacher.legajo,
    ap.name as position_name,
    s.name as school_name
FROM evaluations e
LEFT JOIN profiles p_evaluator ON e.evaluator_id = p_evaluator.id
LEFT JOIN inscriptions i ON e.inscription_id = i.id
LEFT JOIN profiles p_teacher ON i.user_id = p_teacher.id
LEFT JOIN inscription_position_selections ips ON e.position_selection_id = ips.id
LEFT JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN schools s ON ap.school_id = s.id
WHERE e.created_at >= NOW() - INTERVAL '2 hours'
ORDER BY e.created_at DESC;

-- 2. Verificar si las evaluaciones tienen los IDs correctos de selección
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
WHERE e.created_at >= NOW() - INTERVAL '2 hours'
ORDER BY e.created_at DESC;

-- 3. Verificar inscripciones que deberían tener evaluaciones visibles
SELECT
    'Inscriptions that should show evaluations' as info,
    i.id as inscription_id,
    i.user_id,
    i.status as inscription_status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.legajo,
    COUNT(ips.id) as position_selections_count,
    COUNT(iss.id) as subject_selections_count,
    COUNT(e.id) as evaluations_count
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN inscription_position_selections ips ON i.id = ips.inscription_id
LEFT JOIN inscription_subject_selections iss ON i.id = iss.inscription_id
LEFT JOIN evaluations e ON i.id = e.inscription_id
WHERE i.teaching_level = 'secundario'
GROUP BY i.id, i.user_id, i.status, i.teaching_level, p.first_name, p.last_name, p.legajo
HAVING COUNT(e.id) > 0
ORDER BY evaluations_count DESC;

-- 4. Verificar evaluaciones con puntajes pero sin asociaciones correctas
SELECT
    'Evaluations with scores but missing associations' as info,
    e.id as evaluation_id,
    e.inscription_id,
    e.position_selection_id,
    e.subject_selection_id,
    e.titulo_score,
    e.total_score,
    e.status,
    e.created_at,
    CASE 
        WHEN e.position_selection_id IS NULL AND e.subject_selection_id IS NULL THEN 'NO ASSOCIATIONS'
        WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NOT NULL THEN 'BOTH ASSOCIATIONS (INVALID)'
        ELSE 'VALID ASSOCIATION'
    END as association_status
FROM evaluations e
WHERE e.created_at >= NOW() - INTERVAL '2 hours'
AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC;
