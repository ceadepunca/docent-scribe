-- Simple approach: just drop the problematic foreign key constraint
-- This allows profiles to exist without being tied to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;