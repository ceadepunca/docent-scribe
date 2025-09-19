-- Script para diagnosticar políticas RLS
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar políticas RLS para inscription_subject_selections
SELECT 
    'Subject Selections RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inscription_subject_selections';

-- 2. Verificar políticas RLS para inscription_position_selections
SELECT 
    'Position Selections RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inscription_position_selections';

-- 3. Verificar políticas RLS para inscriptions
SELECT 
    'Inscriptions RLS Policies' as info,
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

-- 4. Verificar si RLS está habilitado en estas tablas
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('inscriptions', 'inscription_subject_selections', 'inscription_position_selections');

-- 5. Verificar el usuario actual y sus roles
SELECT 
    'Current User Info' as info,
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 6. Verificar información del usuario
SELECT 
    'User Info' as info,
    p.id as user_id,
    p.first_name,
    p.last_name,
    p.dni,
    p.email
FROM profiles p
WHERE p.id = 'b0f731f0-f901-44cb-963f-66b05ca005db';

-- 7. Verificar si hay datos existentes en las tablas de selecciones
SELECT 
    'Existing Subject Selections' as info,
    COUNT(*) as count
FROM inscription_subject_selections
WHERE inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

SELECT 
    'Existing Position Selections' as info,
    COUNT(*) as count
FROM inscription_position_selections
WHERE inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
