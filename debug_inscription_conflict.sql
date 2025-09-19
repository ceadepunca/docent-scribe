-- Script para diagnosticar el conflicto de inscripción
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar la inscripción específica
SELECT 
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.teaching_level,
    i.created_at,
    i.updated_at,
    p.first_name,
    p.last_name,
    p.dni,
    ip.name as period_name,
    ip.is_active as period_active
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN inscription_periods ip ON i.inscription_period_id = ip.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Verificar si hay otras inscripciones del mismo usuario en el mismo período
SELECT 
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.teaching_level,
    i.created_at,
    p.first_name,
    p.last_name,
    ip.name as period_name
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN inscription_periods ip ON i.inscription_period_id = ip.id
WHERE i.user_id = (
    SELECT user_id 
    FROM inscriptions 
    WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
)
ORDER BY i.created_at DESC;

-- 3. Verificar períodos de inscripción activos
SELECT 
    id,
    name,
    start_date,
    end_date,
    is_active,
    available_levels
FROM inscription_periods
WHERE is_active = true
ORDER BY created_at DESC;

-- 4. Verificar restricciones de la tabla inscriptions
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'inscriptions'::regclass
AND contype = 'u'; -- Solo restricciones únicas

-- 5. Verificar selecciones actuales de la inscripción
SELECT 
    'Subject Selections' as selection_type,
    iss.id,
    iss.subject_id,
    s.name as subject_name,
    sch.name as school_name
FROM inscription_subject_selections iss
JOIN subjects s ON iss.subject_id = s.id
JOIN schools sch ON s.school_id = sch.id
WHERE iss.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'

UNION ALL

SELECT 
    'Position Selections' as selection_type,
    ips.id,
    ips.administrative_position_id,
    ap.name as position_name,
    sch.name as school_name
FROM inscription_position_selections ips
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools sch ON ap.school_id = sch.id
WHERE ips.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
