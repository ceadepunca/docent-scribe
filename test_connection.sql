-- Script simple para probar la conexión a Supabase
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar que podemos acceder a la tabla evaluations
SELECT COUNT(*) as total_evaluations FROM evaluations;

-- 2. Verificar evaluaciones recientes (sin filtro de tiempo)
SELECT 
    e.id,
    e.inscription_id,
    e.titulo_score,
    e.total_score,
    e.updated_at
FROM evaluations e
ORDER BY e.updated_at DESC
LIMIT 5;
