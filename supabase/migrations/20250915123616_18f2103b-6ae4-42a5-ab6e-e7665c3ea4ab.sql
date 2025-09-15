-- Clean up and load new subjects for Fray M Esquiú
-- Step 1: Delete all evaluations related to secondary inscriptions
DELETE FROM public.evaluations 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE teaching_level = 'secundario'
);

-- Step 2: Delete all subject selections related to secondary inscriptions
DELETE FROM public.inscription_subject_selections 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE teaching_level = 'secundario'
);

-- Step 3: Delete all position selections related to secondary inscriptions
DELETE FROM public.inscription_position_selections 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE teaching_level = 'secundario'
);

-- Step 4: Delete all inscription documents related to secondary inscriptions
DELETE FROM public.inscription_documents 
WHERE inscription_id IN (
  SELECT id FROM public.inscriptions 
  WHERE teaching_level = 'secundario'
);

-- Step 5: Delete all secondary inscriptions
DELETE FROM public.inscriptions 
WHERE teaching_level = 'secundario';

-- Step 6: Delete all existing subjects from Fray M Esquiú
DELETE FROM public.subjects 
WHERE school_id = '267a4470-c843-4899-bbfb-224a71069543';

-- Step 7: Delete all administrative positions from Fray M Esquiú
DELETE FROM public.administrative_positions 
WHERE school_id = '267a4470-c843-4899-bbfb-224a71069543';

-- Step 8: Insert the 39 new subjects for Fray M Esquiú
INSERT INTO public.subjects (name, school_id, specialty, is_active, created_at, updated_at) VALUES
('ANTROPOLOGÍA FILOSÓFICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('BIOFÍSICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('BIOLOGÍA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('CIENCIA POLÍTICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('CIUDADANÍA Y POLÍTICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('COMPUTACIÓN', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('CULTURA Y COMUNICACIÓN', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('ECONOMÍA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN AMBIENTAL', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN ARTÍSTICA ARTES VISUALES', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN ARTÍSTICA MÚSICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN ARTÍSTICA PLÁSTICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN DANZA Y TEATRO', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN FÍSICA (MUJERES)', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN FÍSICA (VARONES)', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('EDUCACIÓN TECNOLÓGICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FILOSOFÍA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FILOSOFÍA DE LA CIENCIA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FÍSICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FÍSICA DE LOS MATERIALES', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FÍSICA QUÍMICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FORMACIÓN ÉTICA Y CIUDADANA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('FRANCÉS', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('GEOGRAFÍA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('HISTORIA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('HISTORIA DEL PENSAMIENTO DE LAS INSTITUCIONES', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('INGLÉS', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('INTRODUCCIÓN AL DERECHO', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('INVESTIGACIÓN EN CIENCIAS POLÍTICAS', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('LENGUA Y LITERATURA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('LÓGICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('MATEMÁTICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('METODOLOGÍA DE LAS CIENCIAS NATURALES', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('PSICOLOGÍA DEL DESARROLLO', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('PSICOLOGÍA GENERAL', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('QUÍMICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('QUÍMICA BIOLÓGICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('SOCIOLOGÍA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now()),
('TECNOLOGÍA DE LA INFORMÁTICA', '267a4470-c843-4899-bbfb-224a71069543', 'ciclo_basico', true, now(), now());