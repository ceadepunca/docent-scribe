-- Lista todas las inscripciones con evaluaciones y sus datos principales
SELECT 
  i.id AS inscription_id,
  i.user_id,
  i.status,
  i.teaching_level,
  p.first_name,
  p.last_name,
  p.dni,
  COUNT(e.id) AS cantidad_evaluaciones
FROM public.inscriptions i
JOIN public.profiles p ON i.user_id = p.id
JOIN public.evaluations e ON e.inscription_id = i.id
GROUP BY i.id, i.user_id, i.status, i.teaching_level, p.first_name, p.last_name, p.dni
ORDER BY p.last_name, p.first_name;
