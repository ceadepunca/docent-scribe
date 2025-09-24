-- Script para diagnosticar problemas de RLS (Row Level Security)
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar si RLS está habilitado en las tablas
SELECT 
    'RLS Status Check' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename;

-- 2. Verificar las políticas RLS existentes
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
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename, policyname;

-- 3. Verificar el usuario actual y sus roles
SELECT 
    'Current User Info' as info,
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 4. Verificar si el usuario actual puede acceder a profiles
SELECT 
    'Profiles Access Test' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN dni IS NOT NULL THEN 1 END) as profiles_with_dni
FROM profiles;

-- 5. Verificar si el usuario actual puede acceder a inscriptions
SELECT 
    'Inscriptions Access Test' as info,
    COUNT(*) as total_inscriptions,
    COUNT(CASE WHEN teaching_level = 'secundario' THEN 1 END) as secondary_inscriptions
FROM inscriptions;

-- 6. Verificar si el usuario actual puede acceder a inscription_position_selections
SELECT 
    'Position Selections Access Test' as info,
    COUNT(*) as total_position_selections
FROM inscription_position_selections;

-- 7. Verificar si el usuario actual puede acceder a evaluations
SELECT 
    'Evaluations Access Test' as info,
    COUNT(*) as total_evaluations
FROM evaluations;

