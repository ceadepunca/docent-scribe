-- Script para diagnosticar y corregir el problema al quitar PRECEPTOR/A
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. DIAGNÓSTICO: Verificar evaluaciones vinculadas a PRECEPTOR/A
SELECT 
    'Evaluaciones vinculadas a PRECEPTOR/A' as info,
    e.id as evaluation_id,
    e.inscription_id,
    e.position_selection_id,
    ips.id as position_selection_id_check,
    ap.name as position_name,
    s.name as school_name,
    p.first_name,
    p.last_name
FROM public.evaluations e
LEFT JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
LEFT JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN public.schools s ON ap.school_id = s.id
LEFT JOIN public.inscriptions i ON e.inscription_id = i.id
LEFT JOIN public.profiles p ON i.user_id = p.id
WHERE ap.name = 'PRECEPTOR/A'
   OR (e.position_selection_id IS NOT NULL AND ap.name IS NULL);

-- 2. DIAGNÓSTICO: Verificar selecciones de posición PRECEPTOR/A sin evaluaciones
SELECT 
    'Selecciones PRECEPTOR/A sin evaluaciones' as info,
    ips.id as position_selection_id,
    ips.inscription_id,
    ap.name as position_name,
    s.name as school_name,
    p.first_name,
    p.last_name
FROM public.inscription_position_selections ips
JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN public.schools s ON ap.school_id = s.id
JOIN public.inscriptions i ON ips.inscription_id = i.id
JOIN public.profiles p ON i.user_id = p.id
WHERE ap.name = 'PRECEPTOR/A'
  AND NOT EXISTS (
    SELECT 1 FROM public.evaluations e 
    WHERE e.position_selection_id = ips.id
  );

-- 3. SOLUCIÓN: Crear función para manejar la eliminación segura de selecciones de posición
CREATE OR REPLACE FUNCTION safe_delete_position_selection(
    position_selection_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    evaluation_count INTEGER;
    position_name TEXT;
BEGIN
    -- Verificar si hay evaluaciones vinculadas
    SELECT COUNT(*), ap.name
    INTO evaluation_count, position_name
    FROM public.evaluations e
    JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
    JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
    WHERE ips.id = position_selection_id
    GROUP BY ap.name;
    
    -- Si hay evaluaciones vinculadas, no permitir la eliminación
    IF evaluation_count > 0 THEN
        RAISE EXCEPTION 'No se puede eliminar la selección de posición "%" porque tiene % evaluación(es) vinculada(s). Primero debe eliminar o reasignar las evaluaciones.', 
                       position_name, evaluation_count;
    END IF;
    
    -- Si no hay evaluaciones, proceder con la eliminación
    DELETE FROM public.inscription_position_selections 
    WHERE id = position_selection_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 4. SOLUCIÓN ALTERNATIVA: Función para reasignar evaluaciones antes de eliminar
CREATE OR REPLACE FUNCTION reassign_evaluations_and_delete_position_selection(
    position_selection_id UUID,
    new_position_selection_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    evaluation_count INTEGER;
    position_name TEXT;
BEGIN
    -- Verificar si hay evaluaciones vinculadas
    SELECT COUNT(*), ap.name
    INTO evaluation_count, position_name
    FROM public.evaluations e
    JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
    JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
    WHERE ips.id = position_selection_id
    GROUP BY ap.name;
    
    -- Si hay evaluaciones vinculadas
    IF evaluation_count > 0 THEN
        -- Si se proporciona una nueva selección de posición, reasignar las evaluaciones
        IF new_position_selection_id IS NOT NULL THEN
            UPDATE public.evaluations 
            SET position_selection_id = new_position_selection_id
            WHERE position_selection_id = position_selection_id;
            
            RAISE NOTICE 'Se reasignaron % evaluación(es) de "%" a la nueva selección de posición.', 
                        evaluation_count, position_name;
        ELSE
            -- Si no se proporciona nueva selección, eliminar las evaluaciones
            DELETE FROM public.evaluations 
            WHERE position_selection_id = position_selection_id;
            
            RAISE NOTICE 'Se eliminaron % evaluación(es) vinculadas a "%".', 
                        evaluation_count, position_name;
        END IF;
    END IF;
    
    -- Proceder con la eliminación de la selección de posición
    DELETE FROM public.inscription_position_selections 
    WHERE id = position_selection_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. EJEMPLO DE USO: Eliminar selección PRECEPTOR/A de una inscripción específica
-- (Reemplazar 'INSCRIPTION_ID_AQUI' con el ID real de la inscripción)
/*
SELECT reassign_evaluations_and_delete_position_selection(
    (SELECT ips.id 
     FROM public.inscription_position_selections ips
     JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
     JOIN public.schools s ON ap.school_id = s.id
     WHERE ips.inscription_id = 'INSCRIPTION_ID_AQUI'
       AND ap.name = 'PRECEPTOR/A'
       AND s.name = 'Fray M Esquiú'
     LIMIT 1)
);
*/

-- 6. VERIFICACIÓN: Listar todas las selecciones PRECEPTOR/A de Fray M Esquiú
SELECT 
    'Selecciones PRECEPTOR/A en Fray M Esquiú' as info,
    ips.id as position_selection_id,
    ips.inscription_id,
    p.first_name,
    p.last_name,
    p.dni,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.evaluations e WHERE e.position_selection_id = ips.id) 
        THEN 'CON EVALUACIONES'
        ELSE 'SIN EVALUACIONES'
    END as status
FROM public.inscription_position_selections ips
JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
JOIN public.schools s ON ap.school_id = s.id
JOIN public.inscriptions i ON ips.inscription_id = i.id
JOIN public.profiles p ON i.user_id = p.id
WHERE ap.name = 'PRECEPTOR/A'
  AND s.name = 'Fray M Esquiú'
ORDER BY p.last_name, p.first_name;
