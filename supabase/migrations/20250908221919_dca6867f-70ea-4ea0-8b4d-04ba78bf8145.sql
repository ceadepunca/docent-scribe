-- Add foreign key constraint between inscriptions.user_id and profiles.id
-- This is required for PostgREST embedded joins to work properly
ALTER TABLE public.inscriptions 
ADD CONSTRAINT fk_inscriptions_user_profile 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_inscriptions_user_id ON public.inscriptions(user_id);