-- Script SEGURO para corregir las asociaciones entre evaluaciones y selecciones de cargo
-- Este script respeta las restricciones de la tabla evaluations

-- ========================================
-- CORRECCIÓN SEGURA DE ASOCIACIONES
-- ========================================

-- 1. Verificar evaluaciones que necesitan corrección
SELECT '=== EVALUACIONES QUE NECESITAN CORRECCIÓN ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id as current_position_id,
  e.subject_selection_id as current_subject_id,
  e.titulo_score,
  e.total_score,
  ips.id as correct_position_id,
  ap.name as position_name,
  s.name as school_name,
  CASE 
    WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NOT NULL THEN 'AMBOS - PROBLEMA'
    WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NULL THEN 'POSITION - OK'
    WHEN e.position_selection_id IS NULL AND e.subject_selection_id IS NOT NULL THEN 'SUBJECT - OK'
    ELSE 'NINGUNO - PROBLEMA'
  END as current_status
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;

-- 2. Corregir evaluaciones que tienen AMBOS position_selection_id y subject_selection_id
-- (Esto viola la restricción, necesitamos limpiar uno de ellos)
UPDATE public.evaluations 
SET subject_selection_id = NULL
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE evaluations.inscription_id = i.id
  AND i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (evaluations.titulo_score > 0 OR evaluations.total_score > 0)
  AND evaluations.position_selection_id IS NOT NULL
  AND evaluations.subject_selection_id IS NOT NULL;

-- 3. Corregir evaluaciones que no tienen NINGUNA asociación
UPDATE public.evaluations 
SET position_selection_id = ips.id,
    subject_selection_id = NULL
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE evaluations.inscription_id = i.id
  AND i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (evaluations.titulo_score > 0 OR evaluations.total_score > 0)
  AND evaluations.position_selection_id IS NULL
  AND evaluations.subject_selection_id IS NULL;

-- 4. Corregir evaluaciones que tienen position_selection_id incorrecto
UPDATE public.evaluations 
SET position_selection_id = ips.id
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE evaluations.inscription_id = i.id
  AND i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (evaluations.titulo_score > 0 OR evaluations.total_score > 0)
  AND evaluations.position_selection_id IS NOT NULL
  AND evaluations.position_selection_id != ips.id
  AND evaluations.subject_selection_id IS NULL;

-- 5. Verificar el resultado final
SELECT '=== RESULTADO FINAL ===' as info;
SELECT 
  COUNT(*) as total_evaluations_with_scores,
  COUNT(CASE WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NULL THEN 1 END) as position_only,
  COUNT(CASE WHEN e.position_selection_id IS NULL AND e.subject_selection_id IS NOT NULL THEN 1 END) as subject_only,
  COUNT(CASE WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NOT NULL THEN 1 END) as both_selections,
  COUNT(CASE WHEN e.position_selection_id IS NULL AND e.subject_selection_id IS NULL THEN 1 END) as no_selections
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0);

-- 6. Mostrar ejemplos de evaluaciones corregidas
SELECT '=== EJEMPLOS DE EVALUACIONES CORREGIDAS ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name,
  CASE 
    WHEN e.position_selection_id IS NOT NULL AND e.subject_selection_id IS NULL THEN 'POSITION - CORRECTO'
    WHEN e.position_selection_id IS NULL AND e.subject_selection_id IS NOT NULL THEN 'SUBJECT - CORRECTO'
    ELSE 'PROBLEMA PERSISTENTE'
  END as final_status
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.created_at DESC
LIMIT 10;
