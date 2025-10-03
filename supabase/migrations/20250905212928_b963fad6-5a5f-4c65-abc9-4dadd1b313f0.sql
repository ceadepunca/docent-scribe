-- Fix security warning: Set search_path for the function
-- Also, allow super_admins to bypass period validation for assisted inscriptions.
CREATE OR REPLACE FUNCTION validate_inscription_period()
RETURNS TRIGGER AS $$
DECLARE
  is_super_admin BOOLEAN;
  period_is_valid BOOLEAN;
BEGIN
  -- Check if the current user has the 'super_admin' role.
  -- The auth.uid() function provides the user's ID from the JWT.
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  ) INTO is_super_admin;

  -- If the user is a super_admin, bypass all validation checks for assisted inscriptions.
  IF is_super_admin THEN
    RETURN NEW;
  END IF;

  -- For regular users (docentes), perform all checks in a single query.
  SELECT EXISTS (
    SELECT 1
    FROM inscription_periods
    WHERE id = NEW.inscription_period_id
      AND is_active = true
      AND NOW() BETWEEN start_date AND end_date -- Date check is only for non-admins
      AND NEW.teaching_level = ANY(available_levels)
  ) INTO period_is_valid;

  IF NOT period_is_valid THEN
    -- Provide a more generic but clear error message for security and simplicity.
    RAISE EXCEPTION 'La inscripción no es válida. Verifique que el período esté activo, dentro de las fechas, y que el nivel educativo sea el correcto.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Ensure the trigger is associated with the function
DROP TRIGGER IF EXISTS validate_inscription_period_trigger ON inscriptions;
CREATE TRIGGER validate_inscription_period_trigger
BEFORE INSERT OR UPDATE ON inscriptions
FOR EACH ROW EXECUTE FUNCTION validate_inscription_period();