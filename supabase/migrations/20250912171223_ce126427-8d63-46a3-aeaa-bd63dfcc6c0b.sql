-- Update the validate_inscription_period function to bypass validations for super_admin role
CREATE OR REPLACE FUNCTION public.validate_inscription_period()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip all validations for super_admin users
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RETURN NEW;
  END IF;

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
$function$