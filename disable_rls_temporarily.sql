-- Script para deshabilitar temporalmente RLS en las tablas críticas
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- IMPORTANTE: Esto es una solución temporal para permitir la importación
-- Después de la importación, se pueden restaurar las políticas RLS más restrictivas

-- 1. Verificar el estado actual de RLS
SELECT 
    'Current RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename;

-- 2. Deshabilitar RLS temporalmente en profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Deshabilitar RLS temporalmente en inscriptions
ALTER TABLE inscriptions DISABLE ROW LEVEL SECURITY;

-- 4. Deshabilitar RLS temporalmente en inscription_position_selections
ALTER TABLE inscription_position_selections DISABLE ROW LEVEL SECURITY;

-- 5. Deshabilitar RLS temporalmente en evaluations
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;

-- 6. Verificar que RLS está deshabilitado
SELECT 
    'RLS Status After Disable' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename;

-- 7. Probar acceso a las tablas
SELECT 
    'Access Test After RLS Disable' as info,
    'profiles' as table_name,
    COUNT(*) as accessible_rows
FROM profiles
UNION ALL
SELECT 
    'Access Test After RLS Disable' as info,
    'inscriptions' as table_name,
    COUNT(*) as accessible_rows
FROM inscriptions
UNION ALL
SELECT 
    'Access Test After RLS Disable' as info,
    'inscription_position_selections' as table_name,
    COUNT(*) as accessible_rows
FROM inscription_position_selections
UNION ALL
SELECT 
    'Access Test After RLS Disable' as info,
    'evaluations' as table_name,
    COUNT(*) as accessible_rows
FROM evaluations;

-- 8. Probar consulta específica que fallaba
SELECT 
    'Specific DNI Query Test' as info,
    id,
    first_name,
    last_name,
    dni
FROM profiles
WHERE dni = '873'
LIMIT 1;
