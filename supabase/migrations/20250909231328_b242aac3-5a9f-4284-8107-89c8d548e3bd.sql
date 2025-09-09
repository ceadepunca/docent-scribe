-- Allow profiles to exist without auth.users reference for migrated teachers
-- Drop the existing foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add a new nullable user_id column to link to auth.users when needed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing profiles to use the new user_id column
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Make id column not dependent on auth.users anymore
-- The id will now be a regular UUID primary key

-- Update RLS policies to handle both migrated and regular profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- New RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (auth.uid() = user_id);

-- Allow viewing migrated profiles for evaluators (profiles without user_id)
CREATE POLICY "Evaluators can view migrated profiles" ON public.profiles
FOR SELECT USING (
  (has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)) 
  AND (user_id IS NULL OR EXISTS (SELECT 1 FROM inscriptions WHERE inscriptions.user_id = profiles.user_id))
);

-- Update handle_new_user function to use new user_id column
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  
  -- Assign default role as 'docente' for new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'docente');
  
  RETURN NEW;
END;
$function$;