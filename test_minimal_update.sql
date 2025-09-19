-- Script para probar una actualización mínima
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el estado actual
SELECT 
    'Current State' as info,
    id,
    user_id,
    inscription_period_id,
    status,
    teaching_level,
    subject_area,
    experience_years,
    updated_at
FROM inscriptions
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Probar una actualización mínima (solo cambiar updated_at)
UPDATE inscriptions 
SET updated_at = NOW()
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 3. Verificar que la actualización mínima funcionó
SELECT 
    'After Minimal Update' as info,
    id,
    user_id,
    inscription_period_id,
    status,
    teaching_level,
    subject_area,
    experience_years,
    updated_at
FROM inscriptions
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 4. Probar actualizar solo el status
UPDATE inscriptions 
SET status = 'submitted'
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 5. Verificar el resultado
SELECT 
    'After Status Update' as info,
    id,
    user_id,
    inscription_period_id,
    status,
    teaching_level,
    subject_area,
    experience_years,
    updated_at
FROM inscriptions
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
