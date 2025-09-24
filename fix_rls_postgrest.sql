-- Script para corregir políticas RLS específicas para PostgREST
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- IMPORTANTE: Ejecutar estos comandos como SUPER ADMIN

-- 1. Verificar el usuario actual
SELECT 
    'Current User' as info,
    current_user as user_name,
    current_setting('role') as current_role;

-- 2. Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Allow read profiles by DNI" ON profiles;
DROP POLICY IF EXISTS "Allow read inscriptions" ON inscriptions;
DROP POLICY IF EXISTS "Allow read position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Allow insert evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow update evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow read evaluations" ON evaluations;

-- 3. Crear políticas más específicas para PostgREST
-- Política para profiles - permitir SELECT con filtros específicos
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT
    USING (true);

-- Política para inscriptions - permitir SELECT
CREATE POLICY "inscriptions_select_policy" ON inscriptions
    FOR SELECT
    USING (true);

-- Política para inscription_position_selections - permitir SELECT
CREATE POLICY "position_selections_select_policy" ON inscription_position_selections
    FOR SELECT
    USING (true);

-- Política para evaluations - permitir SELECT, INSERT, UPDATE
CREATE POLICY "evaluations_select_policy" ON evaluations
    FOR SELECT
    USING (true);

CREATE POLICY "evaluations_insert_policy" ON evaluations
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "evaluations_update_policy" ON evaluations
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 4. Verificar que RLS está habilitado pero las políticas permiten acceso
SELECT 
    'RLS Status After Fix' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'inscriptions', 'inscription_position_selections', 'evaluations')
ORDER BY tablename;

-- 5. Verificar las nuevas políticas
SELECT 
    'New RLS Policies' as info,
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

-- 6. Probar acceso específico a profiles por DNI
SELECT 
    'Profiles DNI Test' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN dni = '873' THEN 1 END) as profile_873_exists,
    COUNT(CASE WHEN dni = '1230' THEN 1 END) as profile_1230_exists
FROM profiles;

-- 7. Probar consulta específica que falla en el frontend
SELECT 
    'Specific DNI Query Test' as info,
    id,
    first_name,
    last_name,
    dni
FROM profiles
WHERE dni = '873'
LIMIT 1;

