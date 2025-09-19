-- Script para corregir políticas RLS
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el estado actual de las políticas
SELECT 
    'Current RLS Policies' as info,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('inscription_subject_selections', 'inscription_position_selections')
ORDER BY tablename, policyname;

-- 2. Eliminar políticas existentes problemáticas (si las hay)
-- CUIDADO: Solo ejecutar si es necesario
/*
DROP POLICY IF EXISTS "Users can manage their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can manage their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can insert their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can insert their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can update their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can update their own position selections" ON inscription_position_selections;
DROP POLICY IF EXISTS "Users can delete their own subject selections" ON inscription_subject_selections;
DROP POLICY IF EXISTS "Users can delete their own position selections" ON inscription_position_selections;
*/

-- 3. Crear políticas RLS correctas para inscription_subject_selections
-- Política para INSERT: Los usuarios pueden insertar selecciones para sus propias inscripciones
CREATE POLICY "Users can insert subject selections for their inscriptions" 
ON inscription_subject_selections
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_subject_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para SELECT: Los usuarios pueden ver selecciones de sus propias inscripciones
CREATE POLICY "Users can view subject selections for their inscriptions" 
ON inscription_subject_selections
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_subject_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para UPDATE: Los usuarios pueden actualizar selecciones de sus propias inscripciones
CREATE POLICY "Users can update subject selections for their inscriptions" 
ON inscription_subject_selections
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_subject_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_subject_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para DELETE: Los usuarios pueden eliminar selecciones de sus propias inscripciones
CREATE POLICY "Users can delete subject selections for their inscriptions" 
ON inscription_subject_selections
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_subject_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- 4. Crear políticas RLS correctas para inscription_position_selections
-- Política para INSERT: Los usuarios pueden insertar selecciones para sus propias inscripciones
CREATE POLICY "Users can insert position selections for their inscriptions" 
ON inscription_position_selections
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_position_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para SELECT: Los usuarios pueden ver selecciones de sus propias inscripciones
CREATE POLICY "Users can view position selections for their inscriptions" 
ON inscription_position_selections
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_position_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para UPDATE: Los usuarios pueden actualizar selecciones de sus propias inscripciones
CREATE POLICY "Users can update position selections for their inscriptions" 
ON inscription_position_selections
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_position_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_position_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- Política para DELETE: Los usuarios pueden eliminar selecciones de sus propias inscripciones
CREATE POLICY "Users can delete position selections for their inscriptions" 
ON inscription_position_selections
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM inscriptions i 
        WHERE i.id = inscription_position_selections.inscription_id 
        AND i.user_id = auth.uid()
    )
);

-- 5. Agregar políticas para super admins y evaluadores
-- Super admins pueden hacer todo
CREATE POLICY "Super admins can manage all subject selections" 
ON inscription_subject_selections
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage all position selections" 
ON inscription_position_selections
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Evaluadores pueden ver y modificar selecciones
CREATE POLICY "Evaluators can manage all subject selections" 
ON inscription_subject_selections
FOR ALL 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Evaluators can manage all position selections" 
ON inscription_position_selections
FOR ALL 
USING (has_role(auth.uid(), 'evaluator'::app_role));

-- 6. Verificar las políticas creadas
SELECT 
    'New RLS Policies' as info,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename IN ('inscription_subject_selections', 'inscription_position_selections')
ORDER BY tablename, policyname;
