-- Clean up all data for the SECUNDARIO ORDINARIA 2025 period
-- Period ID: de117a1f-91cd-4d73-b1a2-fc0af190814e

-- Delete in order of dependencies (foreign keys)

-- 1. Delete evaluations first (they reference inscriptions)
DELETE FROM public.evaluations 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 2. Delete subject selections (they reference inscriptions)
DELETE FROM public.inscription_subject_selections 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 3. Delete position selections (they reference inscriptions)
DELETE FROM public.inscription_position_selections 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 4. Delete inscription documents (they reference inscriptions)
DELETE FROM public.inscription_documents 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 5. Delete deletion requests (they reference inscriptions)
DELETE FROM public.inscription_deletion_requests 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 6. Delete inscription history (they reference inscriptions)
DELETE FROM public.inscription_history 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e'
);

-- 7. Finally, delete the inscriptions themselves
DELETE FROM public.inscriptions 
WHERE inscription_period_id = 'de117a1f-91cd-4d73-b1a2-fc0af190814e';