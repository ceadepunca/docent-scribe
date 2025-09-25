-- Vista para exponer inscripciones con estado real de evaluación
CREATE OR REPLACE VIEW public.inscriptions_with_evaluation_status AS
SELECT 
  i.id AS inscription_id,
  i.user_id,
  i.status AS inscription_status,
  i.teaching_level,
  p.first_name,
  p.last_name,
  p.dni,
  i.subject_area,
  i.experience_years,
  i.created_at,
  i.updated_at,
  i.inscription_period_id,
  COUNT(e.id) AS cantidad_evaluaciones,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS evaluaciones_completadas,
  SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) AS evaluaciones_borrador,
  MIN(e.status) AS status_evaluacion
FROM public.inscriptions i
JOIN public.profiles p ON i.user_id = p.id
JOIN public.evaluations e ON e.inscription_id = i.id
GROUP BY i.id, i.user_id, i.status, i.teaching_level, p.first_name, p.last_name, p.dni, i.subject_area, i.experience_years, i.created_at, i.updated_at, i.inscription_period_id;