-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION validate_inscription_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if period exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM inscription_periods 
    WHERE id = NEW.inscription_period_id 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'El período de inscripción no existe o no está activo';
  END IF;

  -- Check if current date is within period range
  IF NOT EXISTS (
    SELECT 1 FROM inscription_periods 
    WHERE id = NEW.inscription_period_id 
    AND NOW() >= start_date 
    AND NOW() <= end_date
  ) THEN
    RAISE EXCEPTION 'El período de inscripción no está dentro del rango de fechas permitido';
  END IF;

  -- Check if teaching level is available for this period
  IF NOT EXISTS (
    SELECT 1 FROM inscription_periods 
    WHERE id = NEW.inscription_period_id 
    AND NEW.teaching_level = ANY(available_levels)
  ) THEN
    RAISE EXCEPTION 'El nivel educativo no está disponible para este período de inscripción';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;