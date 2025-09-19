-- Script para verificar por qué el nuevo docente no tiene evaluaciones importadas
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Verificar información del nuevo docente
SELECT 
    'New Teacher Info' as info,
    i.id as inscription_id,
    i.user_id,
    i.status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.dni,
    p.email
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE i.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869';

-- 2. Verificar si hay otros docentes con el mismo DNI o nombre
SELECT 
    'Similar Teachers' as info,
    i.id as inscription_id,
    i.user_id,
    i.status,
    i.teaching_level,
    p.first_name,
    p.last_name,
    p.dni,
    p.email
FROM inscriptions i
JOIN profiles p ON i.user_id = p.id
WHERE p.dni IN (
    SELECT p2.dni 
    FROM profiles p2 
    JOIN inscriptions i2 ON p2.id = i2.user_id 
    WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
)
OR p.first_name ILIKE '%' || (
    SELECT p2.first_name 
    FROM profiles p2 
    JOIN inscriptions i2 ON p2.id = i2.user_id 
    WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
) || '%'
OR p.last_name ILIKE '%' || (
    SELECT p2.last_name 
    FROM profiles p2 
    JOIN inscriptions i2 ON p2.id = i2.user_id 
    WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
) || '%';

-- 3. Verificar si hay evaluaciones para docentes similares
SELECT 
    'Evaluations for Similar Teachers' as info,
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
WHERE e.inscription_id IN (
    SELECT i.id
    FROM inscriptions i
    JOIN profiles p ON i.user_id = p.id
    WHERE p.dni IN (
        SELECT p2.dni 
        FROM profiles p2 
        JOIN inscriptions i2 ON p2.id = i2.user_id 
        WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
    )
    OR p.first_name ILIKE '%' || (
        SELECT p2.first_name 
        FROM profiles p2 
        JOIN inscriptions i2 ON p2.id = i2.user_id 
        WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
    ) || '%'
    OR p.last_name ILIKE '%' || (
        SELECT p2.last_name 
        FROM profiles p2 
        JOIN inscriptions i2 ON p2.id = i2.user_id 
        WHERE i2.id = '1a958c32-f407-4f6d-b75d-b3eb73ca9869'
    ) || '%'
)
ORDER BY e.created_at DESC;
