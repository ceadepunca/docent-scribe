-- Clean up all test period inscriptions and related data
-- This will keep only "SECUNDARIO ORDINARIA 2025" period

-- First, get the IDs of inscriptions to delete (from test periods)
-- We'll delete everything except "SECUNDARIO ORDINARIA 2025"

-- Delete inscription documents for test periods
DELETE FROM inscription_documents 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete inscription subject selections for test periods
DELETE FROM inscription_subject_selections 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete inscription position selections for test periods
DELETE FROM inscription_position_selections 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete evaluations for test periods
DELETE FROM evaluations 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete inscription history for test periods
DELETE FROM inscription_history 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete deletion requests for test periods
DELETE FROM inscription_deletion_requests 
WHERE inscription_id IN (
  SELECT i.id 
  FROM inscriptions i 
  JOIN inscription_periods ip ON i.inscription_period_id = ip.id 
  WHERE ip.name != 'SECUNDARIO ORDINARIA 2025'
);

-- Delete inscriptions from test periods
DELETE FROM inscriptions 
WHERE inscription_period_id IN (
  SELECT id 
  FROM inscription_periods 
  WHERE name != 'SECUNDARIO ORDINARIA 2025'
);

-- Finally, delete the test periods themselves
DELETE FROM inscription_periods 
WHERE name != 'SECUNDARIO ORDINARIA 2025';