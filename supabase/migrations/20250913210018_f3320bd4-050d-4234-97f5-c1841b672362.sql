-- FASE 1: Actualizar Base de Datos
-- 1.1. Agregar campo specialty a tabla subjects
ALTER TABLE subjects ADD COLUMN specialty TEXT CHECK (specialty IN ('ciclo_basico', 'electromecanica', 'construccion')) DEFAULT 'ciclo_basico';

-- Actualizar todas las materias existentes como 'ciclo_basico'
UPDATE subjects SET specialty = 'ciclo_basico' WHERE specialty IS NULL;

-- Hacer el campo NOT NULL
ALTER TABLE subjects ALTER COLUMN specialty SET NOT NULL;

-- 1.2. Insertar nuevas materias por especialidad para ENET nro 1
-- Materias de Electromecánica
INSERT INTO subjects (name, school_id, specialty) VALUES 
('Electrónica general', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica'),
('Laboratorio de mediciones eléctricas', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica');

-- Materias de Construcción  
INSERT INTO subjects (name, school_id, specialty) VALUES
('Materiales de construcción', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion'),
('Arquitectura I', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion'),
('Arquitectura II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion');

-- 1.3. Agregar nuevos cargos administrativos a ENET nro 1
INSERT INTO administrative_positions (name, school_id) VALUES
('MEP CONSTRUCCIÓN', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'),
('MEP ELECTRICIDAD', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'), 
('MEP INFORMÁTICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'),
('AYUDANTE TÉCNICO DE TRABAJOS PRÁCTICOS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'),
('MEP MECÁNICA Y AJUSTE', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc');