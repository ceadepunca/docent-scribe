-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_position_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;