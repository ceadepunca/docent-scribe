-- Extend the validity period for "SECUNDARIO ORDINARIA 2025" until December 31, 2025
-- This will allow creating assisted inscriptions for the secondary level

-- First, let's check if the period exists and get its current end date
-- Update the end_date to December 31, 2025 at 23:59:59
UPDATE public.inscription_periods 
SET 
  end_date = '2025-12-31 23:59:59+00',
  updated_at = now()
WHERE name = 'SECUNDARIO ORDINARIA 2025';

-- If the period doesn't exist with that exact name, try alternative names
-- Update for "INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO" if it exists
UPDATE public.inscription_periods 
SET 
  end_date = '2025-12-31 23:59:59+00',
  updated_at = now()
WHERE name = 'INSCRIPCIÓN ORDINARIA 2025 - SECUNDARIO';

-- Also check for any period that contains "SECUNDARIO" and "2025" and is currently active
UPDATE public.inscription_periods 
SET 
  end_date = '2025-12-31 23:59:59+00',
  updated_at = now()
WHERE name ILIKE '%SECUNDARIO%' 
  AND name ILIKE '%2025%' 
  AND is_active = true
  AND end_date < '2025-12-31 23:59:59+00';

-- Ensure the period is active
UPDATE public.inscription_periods 
SET 
  is_active = true,
  updated_at = now()
WHERE name ILIKE '%SECUNDARIO%' 
  AND name ILIKE '%2025%' 
  AND end_date >= '2025-12-31 23:59:59+00';
