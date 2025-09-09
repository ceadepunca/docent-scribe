-- Step 1: Add user_id column without foreign key constraint first
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 2: Update existing profiles - only set user_id for those that exist in auth.users
UPDATE public.profiles 
SET user_id = id 
WHERE id IN (SELECT id FROM auth.users) AND user_id IS NULL;

-- Step 3: Now add the foreign key constraint only for the user_id column
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 4: Drop the old foreign key constraint on id if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 5: Update RLS policies to handle both migrated and regular profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Evaluators can view profiles of inscribed users" ON public.profiles;

-- New RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles  
FOR UPDATE USING (auth.uid() = user_id);

-- Allow viewing profiles for evaluators (both migrated and regular)
CREATE POLICY "Evaluators can view all profiles" ON public.profiles
FOR SELECT USING (
  has_role(auth.uid(), 'evaluator'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Step 6: Update handle_new_user function to use new user_id column
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