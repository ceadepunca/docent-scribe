-- Delete defective inscriptions from "INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO" period
-- These inscriptions don't have associated subjects and are in draft status

DELETE FROM public.inscriptions 
WHERE inscription_period_id = (
  SELECT id FROM public.inscription_periods 
  WHERE name = 'INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO'
)
AND status = 'draft'
AND created_at::date = '2024-09-15';