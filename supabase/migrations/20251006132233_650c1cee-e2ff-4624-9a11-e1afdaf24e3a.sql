-- Enable realtime for inscriptions table
ALTER TABLE public.inscriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inscriptions;

-- Enable realtime for evaluations table
ALTER TABLE public.evaluations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evaluations;

-- Enable realtime for profiles table (needed for inscription details)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;