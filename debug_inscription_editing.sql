-- Script para diagnosticar problemas con la edición de inscripciones
-- Verificar si las selecciones se están guardando correctamente

-- ========================================
-- DIAGNÓSTICO DE EDICIÓN DE INSCRIPCIONES
-- ========================================

-- 1. Verificar la inscripción específica que estás editando
SELECT '=== INSCRIPCIÓN ESPECÍFICA ===' as info;
SELECT 
  i.id as inscription_id,
  i.user_id,
  i.teaching_level,
  i.status,
  i.created_at,
  i.updated_at,
  p.first_name,
  p.last_name,
  p.dni
FROM public.inscriptions i
LEFT JOIN public.profiles p ON i.user_id = p.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 2. Verificar las selecciones de materia actuales
SELECT '=== SELECCIONES DE MATERIA ACTUALES ===' as info;
SELECT 
  iss.id,
  iss.inscription_id,
  iss.subject_id,
  iss.position_type,
  s.name as subject_name,
  sch.name as school_name
FROM public.inscription_subject_selections iss
LEFT JOIN public.subjects s ON iss.subject_id = s.id
LEFT JOIN public.schools sch ON s.school_id = sch.id
WHERE iss.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 3. Verificar las selecciones de cargo actuales
SELECT '=== SELECCIONES DE CARGO ACTUALES ===' as info;
SELECT 
  ips.id,
  ips.inscription_id,
  ips.administrative_position_id,
  ap.name as position_name,
  s.name as school_name
FROM public.inscription_position_selections ips
LEFT JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
LEFT JOIN public.schools s ON ap.school_id = s.id
WHERE ips.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 4. Verificar si hay evaluaciones asociadas a estas selecciones
SELECT '=== EVALUACIONES ASOCIADAS ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
  e.position_selection_id,
  e.subject_selection_id,
  e.titulo_score,
  e.total_score,
  e.status,
  e.created_at
FROM public.evaluations e
WHERE e.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';

-- 5. Verificar el historial de cambios en la inscripción
SELECT '=== HISTORIAL DE CAMBIOS ===' as info;
SELECT 
  ih.id,
  ih.inscription_id,
  ih.previous_status,
  ih.new_status,
  ih.notes,
  ih.created_at,
  p.first_name as changed_by_first_name,
  p.last_name as changed_by_last_name
FROM public.inscription_history ih
LEFT JOIN public.profiles p ON ih.changed_by = p.id
WHERE ih.inscription_id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb'
ORDER BY ih.created_at DESC;

-- 6. Verificar si hay problemas de permisos o restricciones
SELECT '=== VERIFICACIÓN DE PERMISOS ===' as info;
SELECT 
  i.id,
  i.user_id,
  i.status,
  CASE 
    WHEN i.status IN ('draft', 'requires_changes', 'submitted') THEN 'EDITABLE'
    ELSE 'NO EDITABLE'
  END as editability_status,
  p.first_name,
  p.last_name
FROM public.inscriptions i
LEFT JOIN public.profiles p ON i.user_id = p.id
WHERE i.id = '98b0f335-b4f1-4e67-80b5-561ba6903ffb';
