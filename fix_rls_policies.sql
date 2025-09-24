-- Script para corregir políticas RLS y permitir la importación
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- IMPORTANTE: Ejecutar estos comandos como SUPER ADMIN o con permisos de administrador

-- 1. Verificar el usuario actual
SELECT 
    'Current User' as info,
    current_user as user_name,
    current_setting('role') as current_role;

-- 2. Crear política para permitir lectura de profiles por DNI
-- Esto permitirá que el frontend pueda buscar docentes por DNI
DROP POLICY IF EXISTS "Allow read profiles by DNI" ON profiles;
CREATE POLICY "Allow read profiles by DNI" ON profiles
    FOR SELECT
    USING (true); -- Permitir lectura a todos los usuarios autenticados

-- 3. Crear política para permitir lectura de inscriptions
DROP POLICY IF EXISTS "Allow read inscriptions" ON inscriptions;
CREATE POLICY "Allow read inscriptions" ON inscriptions
    FOR SELECT
    USING (true); -- Permitir lectura a todos los usuarios autenticados

-- 4. Crear política para permitir lectura de inscription_position_selections
DROP POLICY IF EXISTS "Allow read position selections" ON inscription_position_selections;
CREATE POLICY "Allow read position selections" ON inscription_position_selections
    FOR SELECT
    USING (true); -- Permitir lectura a todos los usuarios autenticados

-- 5. Crear política para permitir inserción de evaluations
DROP POLICY IF EXISTS "Allow insert evaluations" ON evaluations;
CREATE POLICY "Allow insert evaluations" ON evaluations
    FOR INSERT
    WITH CHECK (true); -- Permitir inserción a todos los usuarios autenticados

-- 6. Crear política para permitir actualización de evaluations
DROP POLICY IF EXISTS "Allow update evaluations" ON evaluations;
CREATE POLICY "Allow update evaluations" ON evaluations
    FOR UPDATE
    USING (true)
    WITH CHECK (true); -- Permitir actualización a todos los usuarios autenticados

-- 7. Crear política para permitir lectura de evaluations
DROP POLICY IF EXISTS "Allow read evaluations" ON evaluations;
CREATE POLICY "Allow read evaluations" ON evaluations
    FOR SELECT
    USING (true); -- Permitir lectura a todos los usuarios autenticados

-- 8. Verificar que las políticas se crearon correctamente
SELECT 
    'Updated RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename, policyname;

-- 9. Probar acceso a las tablas
SELECT 
    'Access Test Results' as info,
    'profiles' as table_name,
    COUNT(*) as accessible_rows
FROM profiles
UNION ALL
SELECT 
    'Access Test Results' as info,
    'inscriptions' as table_name,
    COUNT(*) as accessible_rows
FROM inscriptions
UNION ALL
SELECT 
    'Access Test Results' as info,
    'inscription_position_selections' as table_name,
    COUNT(*) as accessible_rows
FROM inscription_position_selections
UNION ALL
SELECT 
    'Access Test Results' as info,
    'evaluations' as table_name,
    COUNT(*) as accessible_rows
FROM evaluations;