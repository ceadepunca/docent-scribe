-- Script para diagnosticar el error 409 específico
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el estado exacto de la inscripción
SELECT 
    'Inscription Details' as info,
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.teaching_level,
    i.subject_area,
    i.experience_years,
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

-- 2. Verificar si hay otras inscripciones del mismo usuario
SELECT 
    'All User Inscriptions' as info,
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
WHERE i.user_id = 'b0f731f0-f901-44cb-963f-66b05ca005db'
ORDER BY i.created_at DESC;

-- 3. Verificar restricciones únicas específicas
SELECT 
    'Unique Constraints' as info,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'inscriptions'::regclass
AND contype = 'u';

-- 4. Verificar si hay algún trigger que pueda estar causando el problema
SELECT 
    'Triggers' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'inscriptions';

-- 5. Verificar RLS policies que puedan estar bloqueando la actualización
SELECT 
    'RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inscriptions';

-- 6. Simular la actualización para ver qué error específico se produce
-- (No ejecutar, solo para referencia)
/*
UPDATE inscriptions 
SET 
    subject_area = 'Secundario',
    teaching_level = 'secundario',
    experience_years = 0,
    inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e',
    user_id = 'b0f731f0-f901-44cb-963f-66b05ca005db',
    status = 'submitted'
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
*/
