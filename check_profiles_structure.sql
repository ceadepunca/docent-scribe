-- Script para verificar la estructura de la tabla profiles
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar las columnas de la tabla profiles
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Ver algunos registros de ejemplo para entender la estructura
SELECT 
    id,
    first_name,
    last_name,
    dni,
    email
FROM profiles 
LIMIT 5;

-- 3. Verificar si hay alguna columna que contenga números de legajo
SELECT 
    id,
    first_name,
    last_name,
    dni,
    email,
    phone
FROM profiles 
WHERE dni IS NOT NULL
LIMIT 10;
