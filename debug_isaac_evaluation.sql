-- Script para verificar específicamente la evaluación de ISAAC NAZARETH VIEL
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar la evaluación específica
SELECT
    'ISAAC Evaluation Details' as info,
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
WHERE e.id = '91f8fd18-e912-4793-a7bb-36db0430d707';

-- 2. Verificar la inscripción asociada
SELECT
    'ISAAC Inscription Details' as info,
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status as inscription_status,
    p_teacher.first_name as teacher_name,
    p_teacher.last_name as teacher_lastname,
    p_teacher.dni
FROM inscriptions i
JOIN profiles p_teacher ON i.user_id = p_teacher.id
WHERE i.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 3. Verificar las selecciones de posición para esta inscripción
SELECT
    'ISAAC Position Selections' as info,
    ips.id as position_selection_id,
    ips.inscription_id,
    ap.name as position_name,
    s.name as school_name
FROM inscription_position_selections ips
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 4. Verificar si la evaluación está asociada correctamente
SELECT
    'ISAAC Evaluation Association' as info,
    e.id as evaluation_id,
    e.position_selection_id,
    ips.id as position_selection_exists,
    ap.name as position_name,
    s.name as school_name
FROM evaluations e
LEFT JOIN inscription_position_selections ips ON e.position_selection_id = ips.id
LEFT JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN schools s ON ap.school_id = s.id
WHERE e.id = '91f8fd18-e912-4793-a7bb-36db0430d707';
