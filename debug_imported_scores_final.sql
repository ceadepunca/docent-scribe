-- Script final para diagnosticar puntajes importados
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar la inscripción específica de MARÍA VIRGINIA DIAZ
SELECT 
    'Inscription Info' as info,
    i.id,
    i.user_id,
    i.status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.dni
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Verificar todas las evaluaciones para esta inscripción
SELECT 
    'All Evaluations for Inscription' as info,
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
    e.notes,
    e.created_at,
    e.updated_at,
    ev.first_name as evaluator_name,
    ev.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles ev ON e.evaluator_id = ev.id
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
ORDER BY e.created_at DESC;

-- 3. Verificar selecciones de posición para esta inscripción
SELECT 
    'Position Selections' as info,
    ips.id,
    ips.inscription_id,
    ips.administrative_position_id,
    ap.name as position_name,
    s.name as school_name
FROM inscription_position_selections ips
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 4. Verificar selecciones de materias para esta inscripción
SELECT 
    'Subject Selections' as info,
    iss.id,
    iss.inscription_id,
    iss.subject_id,
    sub.name as subject_name,
    s.name as school_name
FROM inscription_subject_selections iss
JOIN subjects sub ON iss.subject_id = sub.id
JOIN schools s ON sub.school_id = s.id
WHERE iss.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 5. Verificar si hay evaluaciones asociadas a selecciones específicas
SELECT 
    'Evaluations by Selection' as info,
    e.id,
    e.inscription_id,
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
    CASE 
        WHEN e.position_selection_id IS NOT NULL THEN 'Position Selection'
        WHEN e.subject_selection_id IS NOT NULL THEN 'Subject Selection'
        ELSE 'No Selection'
    END as evaluation_type
FROM evaluations e
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
ORDER BY e.created_at DESC;

-- 6. Verificar el evaluador actual (usuario logueado)
SELECT 
    'Current User' as info,
    auth.uid() as current_user_id,
    p.first_name,
    p.last_name,
    p.email
FROM profiles p
WHERE p.id = auth.uid();
