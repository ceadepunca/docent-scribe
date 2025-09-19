-- Script para verificar la definición exacta de la restricción evaluations_selection_logic
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- Verificar la restricción exacta
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'evaluations_selection_logic';

-- Verificar si hay alguna evaluación existente que funcione
SELECT 
    'Working Evaluation Example' as info,
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
    e.created_at
FROM evaluations e
WHERE e.titulo_score > 0
AND (e.position_selection_id IS NOT NULL OR e.subject_selection_id IS NOT NULL)
LIMIT 1;
