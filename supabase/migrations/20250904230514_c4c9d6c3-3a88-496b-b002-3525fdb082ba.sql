-- Create enums for teaching levels and position types
CREATE TYPE public.teaching_level_enum AS ENUM ('inicial', 'primario', 'secundario');
CREATE TYPE public.position_type_enum AS ENUM ('maestra_sala', 'maestro_grado', 'profesor', 'profesor_especial');

-- Expand profiles table with academic titles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN titulo_1_nombre TEXT;
ALTER TABLE public.profiles ADD COLUMN titulo_1_fecha_egreso DATE;
ALTER TABLE public.profiles ADD COLUMN titulo_1_promedio NUMERIC(4,2);
ALTER TABLE public.profiles ADD COLUMN titulo_2_nombre TEXT;
ALTER TABLE public.profiles ADD COLUMN titulo_2_fecha_egreso DATE;
ALTER TABLE public.profiles ADD COLUMN titulo_2_promedio NUMERIC(4,2);
ALTER TABLE public.profiles ADD COLUMN titulo_3_nombre TEXT;
ALTER TABLE public.profiles ADD COLUMN titulo_3_fecha_egreso DATE;
ALTER TABLE public.profiles ADD COLUMN titulo_3_promedio NUMERIC(4,2);
ALTER TABLE public.profiles ADD COLUMN titulo_4_nombre TEXT;
ALTER TABLE public.profiles ADD COLUMN titulo_4_fecha_egreso DATE;
ALTER TABLE public.profiles ADD COLUMN titulo_4_promedio NUMERIC(4,2);

-- Create position_types table (catalog of teaching positions)
CREATE TABLE public.position_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  teaching_level teaching_level_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default position types
INSERT INTO public.position_types (code, name, teaching_level) VALUES
  ('MS', 'Maestra de Sala', 'inicial'),
  ('MG', 'Maestro de Grado', 'primario'),
  ('PE', 'Profesor Especial', 'inicial'),
  ('PEP', 'Profesor Especial', 'primario'),
  ('PROF', 'Profesor', 'secundario');

-- Create inscription_periods table (control of inscription periods)
CREATE TABLE public.inscription_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  available_levels teaching_level_enum[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teacher_registrations table (legajo management)
CREATE TABLE public.teacher_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  teaching_level teaching_level_enum NOT NULL,
  legajo_code TEXT NOT NULL UNIQUE,
  position_type_id UUID NOT NULL REFERENCES public.position_types(id),
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, teaching_level)
);

-- Modify inscriptions table
ALTER TABLE public.inscriptions ADD COLUMN inscription_period_id UUID REFERENCES public.inscription_periods(id);
ALTER TABLE public.inscriptions ADD COLUMN target_position_type_id UUID REFERENCES public.position_types(id);
ALTER TABLE public.inscriptions ADD COLUMN teaching_level_new teaching_level_enum;

-- Update existing data to use enum values
UPDATE public.inscriptions SET teaching_level_new = 
  CASE 
    WHEN teaching_level = 'inicial' THEN 'inicial'::teaching_level_enum
    WHEN teaching_level = 'primario' THEN 'primario'::teaching_level_enum
    WHEN teaching_level = 'secundario' THEN 'secundario'::teaching_level_enum
    ELSE 'secundario'::teaching_level_enum
  END;

-- Drop old column and rename new one
ALTER TABLE public.inscriptions DROP COLUMN teaching_level;
ALTER TABLE public.inscriptions RENAME COLUMN teaching_level_new TO teaching_level;
ALTER TABLE public.inscriptions ALTER COLUMN teaching_level SET NOT NULL;

-- Enable RLS on new tables
ALTER TABLE public.position_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for position_types (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view position types" 
ON public.position_types FOR SELECT 
TO authenticated USING (true);

-- RLS Policies for inscription_periods
CREATE POLICY "Everyone can view active periods" 
ON public.inscription_periods FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admins can manage all periods" 
ON public.inscription_periods FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for teacher_registrations
CREATE POLICY "Users can view their own registrations" 
ON public.teacher_registrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all registrations" 
ON public.teacher_registrations FOR SELECT 
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Evaluators can view all registrations" 
ON public.teacher_registrations FOR SELECT 
USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all registrations" 
ON public.teacher_registrations FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Function to validate profile completeness
CREATE OR REPLACE FUNCTION public.validate_profile_completeness(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id 
      AND first_name IS NOT NULL AND first_name != ''
      AND last_name IS NOT NULL AND last_name != ''
      AND email IS NOT NULL AND email != ''
      AND phone IS NOT NULL AND phone != ''
      AND titulo_1_nombre IS NOT NULL AND titulo_1_nombre != ''
      AND titulo_1_fecha_egreso IS NOT NULL
      AND titulo_1_promedio IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to generate legajo code
CREATE OR REPLACE FUNCTION public.generate_legajo_code(
  p_teaching_level teaching_level_enum,
  p_position_type_code TEXT
)
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  legajo_code TEXT;
BEGIN
  IF p_teaching_level = 'secundario' THEN
    -- Auto-sequential for secondary level (starting from 4101)
    SELECT COALESCE(MAX(CAST(SUBSTRING(legajo_code FROM '(\d+)') AS INTEGER)), 4100) + 1
    INTO next_number
    FROM public.teacher_registrations 
    WHERE teaching_level = 'secundario'
      AND legajo_code ~ '^\d+$';
    
    legajo_code := next_number::TEXT;
  ELSE
    -- Formatted code for inicial and primario (e.g., MS0001, MG0001)
    SELECT COALESCE(MAX(CAST(SUBSTRING(legajo_code FROM p_position_type_code || '(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.teacher_registrations tr
    JOIN public.position_types pt ON tr.position_type_id = pt.id
    WHERE tr.teaching_level = p_teaching_level
      AND pt.code = p_position_type_code;
    
    legajo_code := p_position_type_code || LPAD(next_number::TEXT, 4, '0');
  END IF;
  
  RETURN legajo_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_inscription_periods_updated_at
BEFORE UPDATE ON public.inscription_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();