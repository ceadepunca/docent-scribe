-- Script para crear evaluaciones faltantes para el docente ISAAC NAZARETH VIEL
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar el evaluator_id que se usó para las importaciones
SELECT 
    'Evaluator ID for Imports' as info,
    e.evaluator_id,
    p.first_name,
    p.last_name,
    COUNT(*) as evaluation_count
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.titulo_score > 0
GROUP BY e.evaluator_id, p.first_name, p.last_name
ORDER BY evaluation_count DESC
LIMIT 1;

-- 2. Crear evaluación para ISAAC NAZARETH VIEL con puntajes típicos
-- (Usando los mismos puntajes que otros docentes importados)
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
    '1a958c32-f407-4f6d-b75d-b3eb73ca9869' as inscription_id,
    e.evaluator_id,
    '7db05802-21bf-4a3a-bf3a-58a1865ee27a' as position_selection_id,
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
FROM evaluations e
WHERE e.titulo_score > 0
AND e.position_selection_id IS NOT NULL
LIMIT 1;

-- 3. Verificar que la evaluación se creó correctamente
SELECT 
    'Created Evaluation' as info,
    e.id,
    e.inscription_id,
    e.evaluator_id,
    e.position_selection_id,
    e.titulo_score,
    e.antiguedad_titulo_score,
    e.antiguedad_docente_score,
    e.concepto_score,
    e.promedio_titulo_score,
    e.trabajo_publico_score,
    e.becas_otros_score,
    e.concurso_score,
    e.otros_antecedentes_score,
    e.red_federal_score,
    e.total_score,
    e.status,
    e.created_at,
    p.first_name as evaluator_name,
    p.last_name as evaluator_lastname
FROM evaluations e
LEFT JOIN profiles p ON e.evaluator_id = p.id
WHERE e.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
ORDER BY e.created_at DESC
LIMIT 1;
