-- Script simple para verificar políticas RLS
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar si RLS está habilitado
SELECT 
    'RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('inscriptions', 'inscription_subject_selections', 'inscription_position_selections');

-- 2. Verificar políticas existentes para inscription_subject_selections
SELECT 
    'Subject Selections Policies' as info,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inscription_subject_selections';

-- 3. Verificar políticas existentes para inscription_position_selections
SELECT 
    'Position Selections Policies' as info,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'inscription_position_selections';

-- 4. Verificar el usuario actual
SELECT 
    'Current User' as info,
    auth.uid() as user_id,
    auth.role() as role;

-- 5. Verificar si hay datos existentes
SELECT 
    'Existing Data' as info,
    'subject_selections' as table_name,
    COUNT(*) as count
FROM inscription_subject_selections
WHERE inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'

UNION ALL

SELECT 
    'Existing Data' as info,
    'position_selections' as table_name,
    COUNT(*) as count
FROM inscription_position_selections
WHERE inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
