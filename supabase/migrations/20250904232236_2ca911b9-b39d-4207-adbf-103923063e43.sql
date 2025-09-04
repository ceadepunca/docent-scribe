-- Add DNI column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dni TEXT;

-- Make DNI unique and not null (after allowing existing users to set it)
-- We'll make it required in a future migration once existing users complete their profiles
CREATE UNIQUE INDEX idx_profiles_dni ON public.profiles(dni) WHERE dni IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.dni IS 'Documento Nacional de Identidad - unique identifier';