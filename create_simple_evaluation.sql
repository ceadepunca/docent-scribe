-- Script simple para crear evaluación para ISAAC NAZARETH VIEL
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- Crear evaluación directamente con solo los campos necesarios
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
VALUES (
    '1a958c32-f407-4f6d-b75d-b3eb73ca9869',  -- inscription_id
    'bc7f6941-a3f6-48c3-b5cd-b5734806231d',  -- evaluator_id (Jorge Rubén Diaz)
    '7db05802-21bf-4a3a-bf3a-58a1865ee27a',  -- position_selection_id (PRECEPTOR/A)
    9.00,  -- titulo_score
    2.00,  -- antiguedad_titulo_score
    2.00,  -- antiguedad_docente_score
    0.00,  -- concepto_score
    0.00,  -- promedio_titulo_score
    0.00,  -- trabajo_publico_score
    0.00,  -- becas_otros_score
    0.00,  -- concurso_score
    0.00,  -- otros_antecedentes_score
    0.00,  -- red_federal_score
    13.00, -- total_score
    'completed',  -- status
    NOW(),  -- created_at
    NOW()   -- updated_at
);

-- Verificar que la evaluación se creó correctamente
SELECT 
    'Created Evaluation' as info,
    e.id,
    e.inscription_id,
    e.evaluator_id,
    e.position_selection_id,
    e.subject_selection_id,
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
