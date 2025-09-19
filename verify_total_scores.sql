-- Script de verificación para confirmar que los total_score se están guardando correctamente
-- Ejecutar este script después de hacer una evaluación para verificar que el total se guardó

-- ========================================
-- VERIFICACIÓN DE TOTAL_SCORE
-- ========================================

-- 1. Verificar el estado general de total_score
SELECT '=== ESTADO GENERAL DE TOTAL_SCORE ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN total_score IS NULL THEN 1 END) as null_total_score,
  COUNT(CASE WHEN total_score = 0 THEN 1 END) as zero_total_score,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as positive_total_score,
  ROUND(AVG(total_score), 2) as average_total_score,
  ROUND(MAX(total_score), 2) as max_total_score,
  ROUND(MIN(total_score), 2) as min_total_score
FROM public.evaluations;

-- 2. Verificar evaluaciones recientes (últimas 24 horas)
SELECT '=== EVALUACIONES RECIENTES (ÚLTIMAS 24 HORAS) ===' as info;
SELECT 
  COUNT(*) as recent_evaluations,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as with_total_score,
  ROUND(AVG(total_score), 2) as average_total_score
FROM public.evaluations 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- 3. Mostrar las evaluaciones más recientes con sus totales
SELECT '=== EVALUACIONES MÁS RECIENTES ===' as info;
SELECT 
  e.id,
  e.inscription_id,
  e.evaluator_id,
  e.total_score,
  e.status,
  e.created_at,
  e.updated_at,
  -- Mostrar algunos puntajes individuales para verificación
  e.titulo_score,
  e.antiguedad_titulo_score,
  e.concepto_score,
  -- Calcular el total manualmente para verificar
  (COALESCE(e.titulo_score, 0) + 
   COALESCE(e.antiguedad_titulo_score, 0) + 
   COALESCE(e.antiguedad_docente_score, 0) + 
   COALESCE(e.concepto_score, 0) + 
   COALESCE(e.promedio_titulo_score, 0) + 
   COALESCE(e.trabajo_publico_score, 0) + 
   COALESCE(e.becas_otros_score, 0) + 
   COALESCE(e.concurso_score, 0) + 
   COALESCE(e.otros_antecedentes_score, 0) + 
   COALESCE(e.red_federal_score, 0)) as calculated_total
FROM public.evaluations e
ORDER BY e.updated_at DESC
LIMIT 10;

-- 4. Verificar que no hay discrepancias entre total_score y la suma de puntajes individuales
SELECT '=== VERIFICACIÓN DE DISCREPANCIAS ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN 
    total_score != (
      COALESCE(titulo_score, 0) + 
      COALESCE(antiguedad_titulo_score, 0) + 
      COALESCE(antiguedad_docente_score, 0) + 
      COALESCE(concepto_score, 0) + 
      COALESCE(promedio_titulo_score, 0) + 
      COALESCE(trabajo_publico_score, 0) + 
      COALESCE(becas_otros_score, 0) + 
      COALESCE(concurso_score, 0) + 
      COALESCE(otros_antecedentes_score, 0) + 
      COALESCE(red_federal_score, 0)
    ) THEN 1 END) as discrepancies
FROM public.evaluations 
WHERE total_score IS NOT NULL;

-- 5. Mostrar evaluaciones con discrepancias (si las hay)
SELECT '=== EVALUACIONES CON DISCREPANCIAS ===' as info;
SELECT 
  id,
  inscription_id,
  total_score,
  (COALESCE(titulo_score, 0) + 
   COALESCE(antiguedad_titulo_score, 0) + 
   COALESCE(antiguedad_docente_score, 0) + 
   COALESCE(concepto_score, 0) + 
   COALESCE(promedio_titulo_score, 0) + 
   COALESCE(trabajo_publico_score, 0) + 
   COALESCE(becas_otros_score, 0) + 
   COALESCE(concurso_score, 0) + 
   COALESCE(otros_antecedentes_score, 0) + 
   COALESCE(red_federal_score, 0)) as calculated_total,
  (total_score - (
    COALESCE(titulo_score, 0) + 
    COALESCE(antiguedad_titulo_score, 0) + 
    COALESCE(antiguedad_docente_score, 0) + 
    COALESCE(concepto_score, 0) + 
    COALESCE(promedio_titulo_score, 0) + 
    COALESCE(trabajo_publico_score, 0) + 
    COALESCE(becas_otros_score, 0) + 
    COALESCE(concurso_score, 0) + 
    COALESCE(otros_antecedentes_score, 0) + 
    COALESCE(red_federal_score, 0)
  )) as difference
FROM public.evaluations 
WHERE total_score IS NOT NULL
  AND total_score != (
    COALESCE(titulo_score, 0) + 
    COALESCE(antiguedad_titulo_score, 0) + 
    COALESCE(antiguedad_docente_score, 0) + 
    COALESCE(concepto_score, 0) + 
    COALESCE(promedio_titulo_score, 0) + 
    COALESCE(trabajo_publico_score, 0) + 
    COALESCE(becas_otros_score, 0) + 
    COALESCE(concurso_score, 0) + 
    COALESCE(otros_antecedentes_score, 0) + 
    COALESCE(red_federal_score, 0)
  )
LIMIT 5;
