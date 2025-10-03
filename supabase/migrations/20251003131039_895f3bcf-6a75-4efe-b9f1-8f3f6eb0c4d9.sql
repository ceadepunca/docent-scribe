-- Agregar nivel inicial: Actualizar restricción de specialty y agregar datos

-- 1. Eliminar restricción CHECK existente y crear una nueva que incluya 'maestros/as especiales'
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_specialty_check;

ALTER TABLE public.subjects ADD CONSTRAINT subjects_specialty_check 
CHECK (specialty IN ('ciclo_basico', 'electromecanica', 'construccion', 'maestros/as especiales'));

-- 2. Insertar la escuela Fray M. Esquiú para nivel inicial
INSERT INTO public.schools (name, teaching_level, is_active, created_at, updated_at)
VALUES ('Fray M Esquiú', 'inicial', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. Insertar materias para nivel inicial en Fray M. Esquiú
INSERT INTO public.subjects (name, school_id, specialty, is_active, display_order, created_at, updated_at)
SELECT 
  subject_name,
  s.id,
  'maestros/as especiales',
  true,
  row_number,
  NOW(),
  NOW()
FROM (
  VALUES 
    ('INGLÉS', 1),
    ('MÚSICA', 2),
    ('EDUCACIÓN FÍSICA', 3)
) AS subjects(subject_name, row_number)
CROSS JOIN (
  SELECT id FROM public.schools 
  WHERE name = 'Fray M Esquiú' AND teaching_level = 'inicial'
  LIMIT 1
) AS s
ON CONFLICT DO NOTHING;

-- 4. Insertar cargos administrativos para nivel inicial en Fray M. Esquiú
INSERT INTO public.administrative_positions (name, school_id, is_active, display_order, created_at, updated_at)
SELECT 
  position_name,
  s.id,
  true,
  row_number,
  NOW(),
  NOW()
FROM (
  VALUES 
    ('MAESTRA DE SALA', 1),
    ('PSICOPEDAGOGO/A', 2),
    ('VICEDIRECTOR/A', 3),
    ('SECRETARIO/A', 4),
    ('DIRECTOR/A', 5)
) AS positions(position_name, row_number)
CROSS JOIN (
  SELECT id FROM public.schools 
  WHERE name = 'Fray M Esquiú' AND teaching_level = 'inicial'
  LIMIT 1
) AS s
ON CONFLICT DO NOTHING;

-- 5. Verificar los datos insertados
SELECT 
  'Escuela' as tipo,
  name as nombre,
  teaching_level::text as nivel
FROM public.schools
WHERE name = 'Fray M Esquiú' AND teaching_level = 'inicial'

UNION ALL

SELECT 
  'Materia' as tipo,
  s.name as nombre,
  s.specialty as nivel
FROM public.subjects s
JOIN public.schools sc ON s.school_id = sc.id
WHERE sc.name = 'Fray M Esquiú' AND sc.teaching_level = 'inicial'

UNION ALL

SELECT 
  'Cargo' as tipo,
  ap.name as nombre,
  'inicial' as nivel
FROM public.administrative_positions ap
JOIN public.schools sc ON ap.school_id = sc.id
WHERE sc.name = 'Fray M Esquiú' AND sc.teaching_level = 'inicial'
ORDER BY tipo, nombre;