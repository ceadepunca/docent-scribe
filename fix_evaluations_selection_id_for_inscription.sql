-- Script para asociar evaluaciones importadas a su position_selection_id para una inscripción específica
-- Reemplaza los IDs según el caso que necesites

UPDATE public.evaluations e
SET position_selection_id = ips.id,
    subject_selection_id = NULL
FROM public.inscription_position_selections ips
WHERE e.inscription_id = ips.inscription_id
  AND e.inscription_id = '77462cad-9ae7-4201-9f61-c596ab95ea64'
  AND (e.position_selection_id IS NULL OR e.position_selection_id != ips.id);

-- Puedes ajustar el inscription_id según el caso que necesites.