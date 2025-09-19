-- Script para corregir las asociaciones entre evaluaciones y selecciones de cargo
-- Este script asegura que las evaluaciones importadas estén correctamente asociadas

-- ========================================
-- CORRECCIÓN DE ASOCIACIONES
-- ========================================

-- 1. Verificar evaluaciones sin asociación correcta
SELECT '=== EVALUACIONES SIN ASOCIACIÓN CORRECTA ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id as current_position_id,
  e.titulo_score,
  e.total_score,
  ips.id as correct_position_id,
  ap.name as position_name,
  s.name as school_name
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
  AND (e.position_selection_id IS NULL OR e.position_selection_id != ips.id)
LIMIT 10;

-- 2. Actualizar evaluaciones para asociarlas correctamente con PRECEPTOR/A
UPDATE public.evaluations 
SET position_selection_id = ips.id
FROM public.inscriptions i
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE evaluations.inscription_id = i.id
  AND i.teaching_level = 'secundario'
  AND ap.name = 'PRECEPTOR/A'
  AND (evaluations.titulo_score > 0 OR evaluations.total_score > 0)
  AND (evaluations.position_selection_id IS NULL OR evaluations.position_selection_id != ips.id);

-- 3. Verificar el resultado de la actualización
SELECT '=== RESULTADO DESPUÉS DE LA ACTUALIZACIÓN ===' as info;
SELECT 
  COUNT(*) as total_evaluations_with_scores,
  COUNT(CASE WHEN e.position_selection_id IS NOT NULL THEN 1 END) as with_position_selection,
  COUNT(CASE WHEN e.position_selection_id IS NULL THEN 1 END) as without_position_selection
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE i.teaching_level = 'secundario'
  AND (e.titulo_score > 0 OR e.total_score > 0);

-- 4. Verificar evaluaciones PRECEPTOR/A correctamente asociadas
SELECT '=== EVALUACIONES PRECEPTOR/A CORRECTAMENTE ASOCIADAS ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.titulo_score,
  e.total_score,
  ap.name as position_name,
  s.name as school_name,
  CASE 
    WHEN e.position_selection_id = ips.id THEN 'Asociación correcta'
    ELSE 'Asociación incorrecta'
  END as association_status
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

-- 5. Verificar que no hay evaluaciones duplicadas
SELECT '=== VERIFICACIÓN DE DUPLICADOS ===' as info;
SELECT 
  e.inscription_id,
  e.position_selection_id,
  COUNT(*) as evaluation_count,
  STRING_AGG(e.id::text, ', ') as evaluation_ids
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
WHERE i.teaching_level = 'secundario'
  AND e.position_selection_id IS NOT NULL
  AND (e.titulo_score > 0 OR e.total_score > 0)
GROUP BY e.inscription_id, e.position_selection_id
HAVING COUNT(*) > 1
ORDER BY evaluation_count DESC;