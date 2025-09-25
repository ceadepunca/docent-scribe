-- Script para verificar evaluaciones del docente actual que estás probando
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar la inscripción del docente actual
SELECT 
    'Current Teacher Inscription' as info,
    i.id,
    i.user_id,
    i.status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.dni
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE i.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 2. Verificar todas las evaluaciones para esta inscripción
SELECT 
    'All Evaluations for Current Teacher' as info,
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
ORDER BY e.created_at DESC;

-- 3. Verificar selecciones de posición para esta inscripción
SELECT 
    'Position Selections for Current Teacher' as info,
    ips.id as position_selection_id,
    ips.inscription_id,
    ap.name as position_name,
    s.name as school_name
FROM inscription_position_selections ips
JOIN administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 4. Verificar selecciones de materia para esta inscripción
SELECT 
    'Subject Selections for Current Teacher' as info,
    iss.id as subject_selection_id,
    iss.inscription_id,
    s.name as subject_name
FROM inscription_subject_selections iss
JOIN subjects s ON iss.subject_id = s.id
WHERE iss.inscription_id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 5. ¿Cuántas inscripciones cumplen el filtro del update?
SELECT COUNT(*) AS inscripciones_submitted_con_evaluacion
FROM public.inscriptions
WHERE status = 'submitted'
  AND id IN (
    SELECT DISTINCT inscription_id
    FROM public.evaluations
    WHERE inscription_id IS NOT NULL
  );

-- 6. ¿Cuántas inscripciones tienen evaluaciones (sin importar el estado)?
SELECT COUNT(DISTINCT i.id) AS inscripciones_con_evaluacion
FROM public.inscriptions i
JOIN public.evaluations e ON e.inscription_id = i.id;

-- 7. ¿Cuáles son los estados actuales de todas las inscripciones con evaluaciones?
SELECT i.status, COUNT(*) AS cantidad
FROM public.inscriptions i
JOIN public.evaluations e ON e.inscription_id = i.id
GROUP BY i.status
ORDER BY cantidad DESC;
