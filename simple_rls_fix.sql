-- Script simple para corregir políticas RLS
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Eliminar todas las políticas existentes problemáticas
DROP POLICY IF EXISTS "Users can manage their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can manage their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can insert their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can insert their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can update their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can update their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can delete their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can delete their own position selections" ON inscription_position_selections;

-- 2. Crear políticas simples y efectivas para inscription_subject_selections
CREATE POLICY "Allow all operations on subject selections" 
ON inscription_subject_selections
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. Crear políticas simples y efectivas para inscription_position_selections
CREATE POLICY "Allow all operations on position selections" 
ON inscription_position_selections
FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. Verificar que las políticas se crearon correctamente
SELECT 
    'New Policies Created' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('inscription_subject_selections', 'inscription_position_selections')
ORDER BY tablename, policyname;
