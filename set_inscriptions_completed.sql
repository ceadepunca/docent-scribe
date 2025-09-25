-- Cambia el estado de las inscripciones de 'submitted' a 'draft' si tienen evaluaciones importadas
UPDATE public.inscriptions
SET status = 'draft'
WHERE status = 'submitted'
  AND id IN (
    SELECT DISTINCT inscription_id
    FROM public.evaluations
    WHERE inscription_id IS NOT NULL
  );
