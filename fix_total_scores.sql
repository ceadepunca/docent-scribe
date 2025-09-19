-- Script para calcular y actualizar los total_score faltantes en las evaluaciones
-- Ejecutar este script para corregir las evaluaciones que no tienen total_score calculado

-- ========================================
-- ACTUALIZAR TOTAL_SCORE EN EVALUACIONES
-- ========================================

-- 1. Verificar cuántas evaluaciones no tienen total_score
SELECT '=== EVALUACIONES SIN TOTAL_SCORE ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN total_score IS NULL OR total_score = 0 THEN 1 END) as missing_total_score,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as with_total_score
FROM public.evaluations;

-- 2. Mostrar ejemplos de evaluaciones que necesitan corrección
SELECT '=== EJEMPLOS DE EVALUACIONES A CORREGIR ===' as info;
SELECT 
  id,
  inscription_id,
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
  (titulo_score + antiguedad_titulo_score + antiguedad_docente_score + concepto_score + 
   promedio_titulo_score + trabajo_publico_score + becas_otros_score + concurso_score + 
   otros_antecedentes_score + red_federal_score) as calculated_total
FROM public.evaluations 
WHERE total_score IS NULL OR total_score = 0
LIMIT 5;

-- 3. Actualizar todas las evaluaciones con el total_score calculado
UPDATE public.evaluations 
SET total_score = (
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
WHERE total_score IS NULL OR total_score = 0;

-- 4. Verificar el resultado de la actualización
SELECT '=== RESULTADO DESPUÉS DE LA ACTUALIZACIÓN ===' as info;
SELECT 
  COUNT(*) as total_evaluations,
  COUNT(CASE WHEN total_score IS NULL OR total_score = 0 THEN 1 END) as still_missing_total_score,
  COUNT(CASE WHEN total_score > 0 THEN 1 END) as with_total_score,
  ROUND(AVG(total_score), 2) as average_total_score,
  ROUND(MAX(total_score), 2) as max_total_score
FROM public.evaluations;

-- 5. Mostrar ejemplos de evaluaciones corregidas
SELECT '=== EJEMPLOS DE EVALUACIONES CORREGIDAS ===' as info;
SELECT 
  id,
  inscription_id,
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
  total_score
FROM public.evaluations 
WHERE total_score > 0
ORDER BY total_score DESC
LIMIT 5;
