-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create performance indexes for teacher search
CREATE INDEX IF NOT EXISTS idx_profiles_dni_trgm ON public.profiles USING gin (dni gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_first_name_trgm ON public.profiles USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name_trgm ON public.profiles USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_migrated ON public.profiles (migrated) WHERE migrated = true;

-- Create indexes for secondary inscription data
CREATE INDEX IF NOT EXISTS idx_schools_active_secondary ON public.schools (is_active, teaching_level) WHERE is_active = true AND teaching_level = 'secundario';
CREATE INDEX IF NOT EXISTS idx_subjects_school_active ON public.subjects (school_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_administrative_positions_school_active ON public.administrative_positions (school_id, is_active) WHERE is_active = true;

-- Create index for inscription periods
CREATE INDEX IF NOT EXISTS idx_inscription_periods_active_dates ON public.inscription_periods (is_active, start_date) WHERE is_active = true;