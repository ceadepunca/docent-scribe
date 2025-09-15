-- Clean up existing ENET data
DELETE FROM public.inscription_subject_selections 
WHERE subject_id IN (
  SELECT id FROM public.subjects WHERE school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'
);

DELETE FROM public.inscription_position_selections 
WHERE administrative_position_id IN (
  SELECT id FROM public.administrative_positions WHERE school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'
);

DELETE FROM public.evaluations 
WHERE subject_selection_id IN (
  SELECT id FROM public.inscription_subject_selections iss
  JOIN public.subjects s ON iss.subject_id = s.id
  WHERE s.school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'
) OR position_selection_id IN (
  SELECT id FROM public.inscription_position_selections ips
  JOIN public.administrative_positions ap ON ips.administrative_position_id = ap.id
  WHERE ap.school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc'
);

DELETE FROM public.subjects WHERE school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc';
DELETE FROM public.administrative_positions WHERE school_id = 'a06dede2-0de2-46f1-a923-a6f09dfc45cc';

-- Insert ENET subjects by specialty
-- CICLO BÁSICO (9 subjects)
INSERT INTO public.subjects (name, school_id, specialty, is_active) VALUES
('BIOLOGÍA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('FÍSICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('FORMACIÓN ÉTICA Y CIUDADANA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('GEOGRAFÍA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('HISTORIA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('INGLÉS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('LENGUA Y LITERATURA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('MATEMÁTICA Y ANÁLISIS MATEMÁTICO', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true),
('QUIMICA Y QUIMICA APLICADA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'ciclo_basico', true);

-- ELECTROMECÁNICA (20 subjects)
INSERT INTO public.subjects (name, school_id, specialty, is_active) VALUES
('ELECTRÓNICA GENERAL', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('ELECTROTECNIA I - II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('EQUIPOS Y APARATOS PARA MANIOBRAS Y TRANSPORTE', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('ESTÁTICA Y RESISTENCIA DE MATERIALES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('INSTALACIONES ELÉCTRICAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('INSTALACIONES ELECTROMECÁNICAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('INSTALACIONES INDUSTRIALES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('INSTALACIONES TÉRMICAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('LABORATORIO DE ENSAYOS INDUSTRIALES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('LABORATORIO DE MEDICIONES ELÉCTRICAS I - II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('MANTENIMIENTO Y REPARACIÓN DE EQUIPOS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('MAQUINAS ELECTRICAS Y ENSAYOS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('MAQUINAS HIDRAULICAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('MECÁNICA TÉCNICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('METALURGIA Y TECNOLOGÍA MECÁNICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('NEUMÁTICA - OLEODINAMICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('ORGANIZACIÓN INDUSTRIAL I - II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('RELACIONES HUMANAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('SEGURIDAD E HIGIENE INDUSTRIAL', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('TECNOLOGÍA DE LA FABRICACIÓN', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true),
('TERMODINAMICA Y MAQUINAS TERMICAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'electromecanica', true);

-- CONSTRUCCIÓN (16 subjects)
INSERT INTO public.subjects (name, school_id, specialty, is_active) VALUES
('ADMINISTRACIÓN Y CONDUCCIÓN DE OBRAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('ARQUITECTURA I - II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('CÓMPUTOS Y PRESUPUESTOS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('CONSTRUCCIONES COMPLEMENTARIAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('CONSTRUCCIONES DE ALBAÑILERÍA Y FUNDACIÓN', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('CONSTRUCCIONES METÁLICAS Y DE MADERA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('DIBUJO TÉCNICO (CSC)', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('ESTRUCTURAS I-II-III', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('LEGISLACIÓN DE LA CONSTRUCCIÓN', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('MATERIALES DE CONSTRUCCIÓN', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('OBRAS SANITARIAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('PROYECTOS I - II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('TOPOGRAFÍA Y OBRAS VIALES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('TRABAJO PRACTICO DE ESTRUCTURAS I-II', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('TRABAJO PRÁCTICO DE PROYECTO FINAL', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true),
('VISITA DE OBRAS', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', 'construccion', true);

-- Insert ENET administrative positions
-- General positions (8)
INSERT INTO public.administrative_positions (name, school_id, is_active) VALUES
('DIRECTOR/A', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('VICEDIRECTOR/A', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('REGENTE DE CULTURA GENERAL', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('REGENTE DE CULTURA TÉCNICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('SECRETARIO/A', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('PROSECRETARIO/A', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('ASESOR/A PEDAGÓGICO/A', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('JEFE GENERAL DE TALLERES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true);

-- Electromecánica positions (4)
INSERT INTO public.administrative_positions (name, school_id, is_active) VALUES
('JEFE SECCIÓN MECÁNICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('JEFE SECCIÓN ELECTRICIDAD', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('MEP ELECTRICIDAD', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('MEP MECÁNICA Y AJUSTE', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true);

-- Construcción positions (3)
INSERT INTO public.administrative_positions (name, school_id, is_active) VALUES
('JEFE SECCIÓN CONSTRUCCIONES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('MEP CONSTRUCCIONES', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true),
('MEP INFORMÁTICA', 'a06dede2-0de2-46f1-a923-a6f09dfc45cc', true);