-- Clean up defective draft inscriptions for the specified period
-- Only delete inscriptions created on 2025-09-15 that have no subject selections
DELETE FROM public.inscriptions i
USING public.inscription_periods p
WHERE i.inscription_period_id = p.id
  AND p.name = 'INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO'
  AND i.status = 'draft'
  AND i.created_at::date = '2025-09-15'
  AND NOT EXISTS (
    SELECT 1 FROM public.inscription_subject_selections s
    WHERE s.inscription_id = i.id
  );