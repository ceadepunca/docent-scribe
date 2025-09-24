-- Script para actualizar inscription_id en evaluaciones importadas
-- Asigna inscription_id a todas las evaluaciones importadas que no lo tengan
-- Modifica la condición de la fecha si es necesario

UPDATE public.evaluations
SET inscription_id = '61fb0807-20fa-4b4b-9c96-d1feb8671992'
WHERE inscription_id IS NULL OR inscription_id != '61fb0807-20fa-4b4b-9c96-d1feb8671992';

-- Puedes ejecutar este script en el SQL Editor de Supabase
