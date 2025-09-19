-- Script para corregir conflictos de inscripción
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el estado actual de la inscripción problemática
SELECT 
    'Current Inscription State' as info,
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.teaching_level,
    i.created_at,
    p.first_name,
    p.last_name,
    ip.name as period_name
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN inscription_periods ip ON i.inscription_period_id = ip.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Verificar si hay duplicados del mismo usuario en el mismo período
SELECT 
    'Potential Duplicates' as info,
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.created_at,
    p.first_name,
    p.last_name
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE i.user_id = (
    SELECT user_id 
    FROM inscriptions 
    WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
)
AND i.inscription_period_id = (
    SELECT inscription_period_id 
    FROM inscriptions 
    WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
)
ORDER BY i.created_at DESC;

-- 3. Si hay duplicados, eliminar los más antiguos (mantener solo el más reciente)
-- CUIDADO: Solo ejecutar si hay duplicados confirmados
/*
WITH ranked_inscriptions AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, inscription_period_id ORDER BY created_at DESC) as rn
  FROM inscriptions
  WHERE user_id = (
    SELECT user_id 
    FROM inscriptions 
    WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
  )
  AND inscription_period_id = (
    SELECT inscription_period_id 
    FROM inscriptions 
    WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
  )
)
DELETE FROM inscriptions 
WHERE id IN (
  SELECT id FROM ranked_inscriptions WHERE rn > 1
);
*/

-- 4. Verificar que la inscripción tenga el período correcto
-- Si el período no está activo, actualizar al período activo actual
UPDATE inscriptions 
SET inscription_period_id = (
  SELECT id FROM inscription_periods 
  WHERE is_active = true 
  LIMIT 1
)
WHERE id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
AND inscription_period_id NOT IN (
  SELECT id FROM inscription_periods WHERE is_active = true
);

-- 5. Verificar el estado final
SELECT 
    'Final State' as info,
    i.id,
    i.user_id,
    i.inscription_period_id,
    i.status,
    i.teaching_level,
    i.updated_at,
    p.first_name,
    p.last_name,
    ip.name as period_name,
    ip.is_active as period_active
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
LEFT JOIN inscription_periods ip ON i.inscription_period_id = ip.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
