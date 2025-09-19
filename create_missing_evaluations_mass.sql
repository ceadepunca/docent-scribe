-- Script para crear evaluaciones faltantes para TODOS los docentes importados
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar cuántos docentes importados NO tienen evaluaciones
SELECT 
    'Teachers without evaluations' as info,
    COUNT(*) as count
FROM inscriptions i
JOIN inscription_position_selections ips ON i.id = ips.inscription_id
WHERE ips.administrative_position_id = (
    SELECT ap.id 
    FROM administrative_positions ap 
    JOIN schools s ON ap.school_id = s.id 
    WHERE ap.name = 'PRECEPTOR/A' AND s.name = 'Fray M Esquiú'
)
AND i.id NOT IN (
    SELECT DISTINCT e.inscription_id 
    FROM evaluations e 
    WHERE e.position_selection_id = ips.id
);

-- 2. Crear evaluaciones para todos los docentes que no las tienen
INSERT INTO evaluations (
    inscription_id,
    evaluator_id,
    position_selection_id,
    titulo_score,
    antiguedad_titulo_score,
    antiguedad_docente_score,
    concepto_score,
    promedio_titulo_score,
    trabajo_publico_score,
    becas_otros_score,
    concurso_score,
    otros_antecedentes_score,
    red_federal_score,
    total_score,
    status,
    created_at,
    updated_at
)
SELECT 
    i.id as inscription_id,
    'bc7f6941-a3f6-48c3-b5cd-b5734806231d' as evaluator_id,  -- Jorge Rubén Diaz (importador)
    ips.id as position_selection_id,
    9.00 as titulo_score,
    2.00 as antiguedad_titulo_score,
    2.00 as antiguedad_docente_score,
    0.00 as concepto_score,
    0.00 as promedio_titulo_score,
    0.00 as trabajo_publico_score,
    0.00 as becas_otros_score,
    0.00 as concurso_score,
    0.00 as otros_antecedentes_score,
    0.00 as red_federal_score,
    13.00 as total_score,
    'completed' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM inscriptions i
JOIN inscription_position_selections ips ON i.id = ips.inscription_id
WHERE ips.administrative_position_id = (
    SELECT ap.id 
    FROM administrative_positions ap 
    JOIN schools s ON ap.school_id = s.id 
    WHERE ap.name = 'PRECEPTOR/A' AND s.name = 'Fray M Esquiú'
)
AND i.id NOT IN (
    SELECT DISTINCT e.inscription_id 
    FROM evaluations e 
    WHERE e.position_selection_id = ips.id
);

-- 3. Verificar cuántas evaluaciones se crearon
SELECT 
    'Created evaluations count' as info,
    COUNT(*) as count
FROM evaluations e
WHERE e.evaluator_id = 'bc7f6941-a3f6-48c3-b5cd-b5734806231d'
AND e.created_at >= NOW() - INTERVAL '1 minute';
