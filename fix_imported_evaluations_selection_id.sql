-- Script para asociar evaluaciones importadas a su position_selection_id correspondiente
-- Asume que todas las evaluaciones importadas tienen inscription_id = '61fb0807-20fa-4b4b-9c96-d1feb8671992'
-- y que deben asociarse a la selección de cargo PRECEPTOR/A de esa inscripción

UPDATE public.evaluations e
SET position_selection_id = ips.id,
    subject_selection_id = NULL
FROM public.inscription_position_selections ips
INNER JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
WHERE e.inscription_id = ips.inscription_id
  AND ap.name = 'PRECEPTOR/A'
  AND e.inscription_id = '61fb0807-20fa-4b4b-9c96-d1feb8671992'
  AND (e.position_selection_id IS NULL OR e.position_selection_id != ips.id);

-- Si necesitas asociar subject_selection_id, avísame.