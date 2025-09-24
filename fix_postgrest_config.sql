-- Script para configurar PostgREST y permitir consultas específicas
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- IMPORTANTE: Ejecutar estos comandos como SUPER ADMIN

-- 1. Verificar el usuario actual
SELECT 
    'Current User' as info,
    current_user as user_name,
    current_setting('role') as current_role;

-- 2. Crear una función que permita consultas específicas por DNI
CREATE OR REPLACE FUNCTION get_profile_by_dni(profile_dni TEXT)
RETURNS TABLE (
    id UUID,
    first_name TEXT,
    last_name TEXT,
    dni TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT p.id, p.first_name, p.last_name, p.dni
    FROM profiles p
    WHERE p.dni = profile_dni;
$$;

-- 3. Crear una función para obtener inscripciones por user_id
CREATE OR REPLACE FUNCTION get_inscription_by_user(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    teaching_level TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT i.id, i.user_id, i.teaching_level
    FROM inscriptions i
    WHERE i.user_id = user_uuid AND i.teaching_level = 'secundario';
$$;

-- 4. Crear una función para obtener selecciones de posición
CREATE OR REPLACE FUNCTION get_position_selection_by_inscription(inscription_uuid UUID)
RETURNS TABLE (
    id UUID,
    inscription_id UUID,
    administrative_position_id UUID,
    position_name TEXT,
    school_name TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        ips.id,
        ips.inscription_id,
        ips.administrative_position_id,
        ap.name as position_name,
        s.name as school_name
    FROM inscription_position_selections ips
    JOIN administrative_positions ap ON ap.id = ips.administrative_position_id
    JOIN schools s ON s.id = ap.school_id
    WHERE ips.inscription_id = inscription_uuid
    AND ap.name = 'PRECEPTOR/A' 
    AND s.name = 'Fray M Esquiú';
$$;

-- 5. Crear una función para insertar/actualizar evaluaciones
CREATE OR REPLACE FUNCTION upsert_evaluation(
    p_inscription_id UUID,
    p_evaluator_id UUID,
    p_position_selection_id UUID,
    p_titulo_score NUMERIC,
    p_antiguedad_titulo_score NUMERIC,
    p_antiguedad_docente_score NUMERIC,
    p_concepto_score NUMERIC,
    p_promedio_titulo_score NUMERIC,
    p_trabajo_publico_score NUMERIC,
    p_becas_otros_score NUMERIC,
    p_concurso_score NUMERIC,
    p_otros_antecedentes_score NUMERIC,
    p_red_federal_score NUMERIC,
    p_total_score NUMERIC
)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
AS $$
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
        title_type
    )
    VALUES (
        p_inscription_id,
        p_evaluator_id,
        p_position_selection_id,
        p_titulo_score,
        p_antiguedad_titulo_score,
        p_antiguedad_docente_score,
        p_concepto_score,
        p_promedio_titulo_score,
        p_trabajo_publico_score,
        p_becas_otros_score,
        p_concurso_score,
        p_otros_antecedentes_score,
        p_red_federal_score,
        p_total_score,
        'draft',
        'docente'
    )
    ON CONFLICT (inscription_id, position_selection_id) 
    DO UPDATE SET
        titulo_score = EXCLUDED.titulo_score,
        antiguedad_titulo_score = EXCLUDED.antiguedad_titulo_score,
        antiguedad_docente_score = EXCLUDED.antiguedad_docente_score,
        concepto_score = EXCLUDED.concepto_score,
        promedio_titulo_score = EXCLUDED.promedio_titulo_score,
        trabajo_publico_score = EXCLUDED.trabajo_publico_score,
        becas_otros_score = EXCLUDED.becas_otros_score,
        concurso_score = EXCLUDED.concurso_score,
        otros_antecedentes_score = EXCLUDED.otros_antecedentes_score,
        red_federal_score = EXCLUDED.red_federal_score,
        total_score = EXCLUDED.total_score,
        status = 'draft',
        updated_at = NOW()
    RETURNING id;
$$;

-- 6. Probar las funciones
SELECT 
    'Function Test' as info,
    'get_profile_by_dni' as function_name,
    COUNT(*) as test_results
FROM get_profile_by_dni('873');

-- 7. Verificar que las funciones se crearon
SELECT 
    'Created Functions' as info,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%profile%' OR routine_name LIKE '%inscription%' OR routine_name LIKE '%evaluation%'
ORDER BY routine_name;

