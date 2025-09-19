-- Script de verificación final para confirmar que todo está funcionando
-- Ejecutar este script para ver el estado final del sistema

-- ========================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA
-- ========================================

-- 1. Verificar evaluaciones con puntajes
SELECT '=== EVALUACIONES CON PUNTAJES ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN titulo_score > 0 THEN 1 END) as with_titulo_score,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as with_total_score,
  COUNT(CASE WHEN position_selection_id IS NOT NULL THEN 1 END) as with_position_association
FROM public.evaluations;

-- 2. Verificar inscripciones secundarias
SELECT '=== INSCRIPCIONES SECUNDARIAS ===' as info;
SELECT 
  COUNT(*) as total_secondary_inscriptions,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_status
FROM public.inscriptions 
WHERE teaching_level = 'secundario';

-- 3. Verificar selecciones de cargo PRECEPTOR/A
SELECT '=== SELECCIONES DE CARGO PRECEPTOR/A ===' as info;
SELECT 
  COUNT(*) as total_preceptor_selections,
  COUNT(DISTINCT ips.inscription_id) as unique_inscriptions
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE ap.name = 'PRECEPTOR/A';

-- 4. Verificar asociaciones completas
SELECT '=== ASOCIACIONES COMPLETAS ===' as info;
SELECT 
  COUNT(*) as complete_associations
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON i.id = ips.inscription_id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE i.teaching_level = 'secundario' 
  AND ap.name = 'PRECEPTOR/A'
  AND e.position_selection_id = ips.id;

-- 5. Mostrar ejemplos de datos que deberían aparecer en la grilla
SELECT '=== EJEMPLOS DE DATOS PARA LA GRILLA ===' as info;
SELECT 
  e.id as evaluation_id,
  e.inscription_id,
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
  ap.name as position_name,
  s.name as school_name,
  i.status as inscription_status
FROM public.evaluations e
INNER JOIN public.inscriptions i ON e.inscription_id = i.id
INNER JOIN public.inscription_position_selections ips ON e.position_selection_id = ips.id
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
INNER JOIN public.schools s ON ap.school_id = s.id
WHERE ap.name = 'PRECEPTOR/A'
  AND (e.titulo_score > 0 OR e.total_score > 0)
ORDER BY e.total_score DESC
LIMIT 5;
