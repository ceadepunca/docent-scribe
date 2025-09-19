-- Script para verificar la restricción exacta de evaluations_selection_logic
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- Verificar la restricción exacta
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'evaluations_selection_logic';

-- Verificar la estructura de la tabla evaluations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'evaluations' 
AND column_name IN ('position_selection_id', 'subject_selection_id')
ORDER BY ordinal_position;
