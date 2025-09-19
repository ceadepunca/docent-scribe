-- Script para verificar los IDs de selección
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar selecciones de posición para la inscripción
SELECT 
    'Position Selections' as info,
    ips.id as position_selection_id,
    ips.inscription_id,
    ap.name as position_name,
    s.name as school_name
FROM inscription_position_selections ips
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Verificar selecciones de materias para la inscripción
SELECT 
    'Subject Selections' as info,
    iss.id as subject_selection_id,
    iss.inscription_id,
    sub.name as subject_name,
    s.name as school_name
FROM inscription_subject_selections iss
JOIN subjects sub ON iss.subject_id = sub.id
JOIN schools s ON sub.school_id = s.id
WHERE iss.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 3. Verificar si los IDs de las evaluaciones coinciden con las selecciones
SELECT 
    'Evaluation vs Selection Match' as info,
    e.id as evaluation_id,
    e.position_selection_id,
    e.subject_selection_id,
    CASE 
        WHEN e.position_selection_id IS NOT NULL THEN 
            (SELECT ap.name FROM inscription_position_selections ips 
             JOIN administrative_positions ap ON ips.administrative_position_id = ap.id 
             WHERE ips.id = e.position_selection_id)
        WHEN e.subject_selection_id IS NOT NULL THEN 
            (SELECT sub.name FROM inscription_subject_selections iss 
             JOIN subjects sub ON iss.subject_id = sub.id 
             WHERE iss.id = e.subject_selection_id)
        ELSE 'No Selection'
    END as selection_name
FROM evaluations e
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
