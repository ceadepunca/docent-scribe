-- Create new inscription period "INSCRIPCIÓN ORDINARIA 2025"
INSERT INTO public.inscription_periods (
  name, 
  description, 
  start_date, 
  end_date, 
  available_levels, 
  is_active, 
  created_by
) VALUES (
  'INSCRIPCIÓN ORDINARIA 2025',
  'Período ordinario de inscripciones para el año 2025',
  '2025-06-01 00:00:00+00',
  '2025-08-22 23:59:59+00',
  ARRAY['inicial', 'primario', 'secundario']::teaching_level_enum[],
  true,
  '00000000-0000-0000-0000-000000000000'
);

-- Deactivate existing period
UPDATE public.inscription_periods 
SET is_active = false 
WHERE name = 'INSCRIPCIÓN DE PRUEBA SEPTIEMBRE 25';

-- Add new columns to profiles table for migrated teachers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS legajo_number text,
ADD COLUMN IF NOT EXISTS migrated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS data_complete boolean DEFAULT true;

-- Create unique index on dni
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_dni_unique ON public.profiles(dni) WHERE dni IS NOT NULL;

-- Update RLS policies for migrated profiles
DROP POLICY IF EXISTS "Super admins can manage migrated profiles" ON public.profiles;
CREATE POLICY "Super admins can manage migrated profiles" 
ON public.profiles FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super admins to create inscriptions without period validation
DROP POLICY IF EXISTS "Super admins can create inscriptions without period validation" ON public.inscriptions;
CREATE POLICY "Super admins can create inscriptions without period validation"
ON public.inscriptions FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));