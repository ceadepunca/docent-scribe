-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teaching_level teaching_level_enum NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create administrative_positions table
CREATE TABLE public.administrative_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inscription_subject_selections table
CREATE TABLE public.inscription_subject_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  position_type TEXT NOT NULL CHECK (position_type IN ('profesor', 'suplente')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inscription_id, subject_id, position_type)
);

-- Create inscription_position_selections table
CREATE TABLE public.inscription_position_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID NOT NULL REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  administrative_position_id UUID NOT NULL REFERENCES public.administrative_positions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inscription_id, administrative_position_id)
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrative_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_subject_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscription_position_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schools
CREATE POLICY "Everyone can view active schools" ON public.schools FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage all schools" ON public.schools FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for subjects
CREATE POLICY "Everyone can view active subjects" ON public.subjects FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage all subjects" ON public.subjects FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for administrative_positions
CREATE POLICY "Everyone can view active positions" ON public.administrative_positions FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage all positions" ON public.administrative_positions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for inscription_subject_selections
CREATE POLICY "Users can manage their own subject selections" ON public.inscription_subject_selections 
FOR ALL USING (EXISTS (SELECT 1 FROM inscriptions WHERE inscriptions.id = inscription_subject_selections.inscription_id AND inscriptions.user_id = auth.uid()));

CREATE POLICY "Evaluators can view all subject selections" ON public.inscription_subject_selections 
FOR SELECT USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all subject selections" ON public.inscription_subject_selections 
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for inscription_position_selections
CREATE POLICY "Users can manage their own position selections" ON public.inscription_position_selections 
FOR ALL USING (EXISTS (SELECT 1 FROM inscriptions WHERE inscriptions.id = inscription_position_selections.inscription_id AND inscriptions.user_id = auth.uid()));

CREATE POLICY "Evaluators can view all position selections" ON public.inscription_position_selections 
FOR SELECT USING (has_role(auth.uid(), 'evaluator'::app_role));

CREATE POLICY "Super admins can manage all position selections" ON public.inscription_position_selections 
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_administrative_positions_updated_at BEFORE UPDATE ON public.administrative_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for schools
INSERT INTO public.schools (name, teaching_level) VALUES 
('Fray M Esquiú', 'secundario'),
('ENET nro 1', 'secundario');

-- Insert seed data for subjects
WITH school_data AS (
  SELECT id, name FROM public.schools WHERE teaching_level = 'secundario'
)
INSERT INTO public.subjects (name, school_id)
SELECT subject_name, school_id
FROM (
  SELECT 'Matemáticas' as subject_name
  UNION SELECT 'Lengua'
  UNION SELECT 'Historia'
  UNION SELECT 'Geografía'
  UNION SELECT 'Biología'
  UNION SELECT 'Física'
  UNION SELECT 'Química'
  UNION SELECT 'Inglés'
  UNION SELECT 'Educación Física'
  UNION SELECT 'Tecnología'
) subjects
CROSS JOIN school_data;

-- Insert seed data for administrative positions
WITH school_data AS (
  SELECT id FROM public.schools WHERE teaching_level = 'secundario'
)
INSERT INTO public.administrative_positions (name, school_id)
SELECT position_name, school_id
FROM (
  SELECT 'Director' as position_name
  UNION SELECT 'Vice Director'
  UNION SELECT 'Secretario'
  UNION SELECT 'Pro Secretario'
  UNION SELECT 'Preceptor'
  UNION SELECT 'Bibliotecario'
  UNION SELECT 'Coordinador de Área'
) positions
CROSS JOIN school_data;