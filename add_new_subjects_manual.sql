-- Script para agregar nuevas materias y reordenar existentes
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- 1. Agregar DIBUJO TÉCNICO (CB) en ciclo básico
INSERT INTO public.subjects (name, school_id, specialty, is_active)
SELECT 
  'DIBUJO TÉCNICO (CB)',
  s.id,
  'ciclo_basico',
  true
FROM public.schools s
WHERE s.name = 'ENET nro 1'
AND NOT EXISTS (
  SELECT 1 FROM public.subjects 
  WHERE name = 'DIBUJO TÉCNICO (CB)' 
  AND school_id = s.id 
  AND specialty = 'ciclo_basico'
);

-- 2. Agregar DIBUJOS Y ELEMENTOS DE MÁQUINAS en electromecanica
INSERT INTO public.subjects (name, school_id, specialty, is_active)
SELECT 
  'DIBUJOS Y ELEMENTOS DE MÁQUINAS',
  s.id,
  'electromecanica',
  true
FROM public.schools s
WHERE s.name = 'ENET nro 1'
AND NOT EXISTS (
  SELECT 1 FROM public.subjects 
  WHERE name = 'DIBUJOS Y ELEMENTOS DE MÁQUINAS' 
  AND school_id = s.id 
  AND specialty = 'electromecanica'
);

-- 3. Agregar columna display_order si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.subjects ADD COLUMN display_order INTEGER;
    END IF;
END $$;

-- 4. Reordenar materias de CICLO BÁSICO (orden alfabético)
UPDATE public.subjects 
SET display_order = CASE 
    WHEN name = 'BIOLOGÍA' THEN 1
    WHEN name = 'DIBUJO TÉCNICO (CB)' THEN 2
    WHEN name = 'FÍSICA' THEN 3
    WHEN name = 'FORMACIÓN ÉTICA Y CIUDADANA' THEN 4
    WHEN name = 'GEOGRAFÍA' THEN 5
    WHEN name = 'HISTORIA' THEN 6
    WHEN name = 'INGLÉS' THEN 7
    WHEN name = 'LENGUA Y LITERATURA' THEN 8
    WHEN name = 'MATEMÁTICA Y ANÁLISIS MATEMÁTICO' THEN 9
    WHEN name = 'QUIMICA Y QUIMICA APLICADA' THEN 10
END
WHERE school_id = (SELECT id FROM public.schools WHERE name = 'ENET nro 1')
AND specialty = 'ciclo_basico';

-- 5. Reordenar materias de ELECTROMECÁNICA (orden alfabético)
UPDATE public.subjects 
SET display_order = CASE 
    WHEN name = 'DIBUJOS Y ELEMENTOS DE MÁQUINAS' THEN 1
    WHEN name = 'ELECTRÓNICA GENERAL' THEN 2
    WHEN name = 'ELECTROTECNIA I - II' THEN 3
    WHEN name = 'EQUIPOS Y APARATOS PARA MANIOBRAS Y TRANSPORTE' THEN 4
    WHEN name = 'ESTÁTICA Y RESISTENCIA DE MATERIALES' THEN 5
    WHEN name = 'INSTALACIONES ELÉCTRICAS' THEN 6
    WHEN name = 'INSTALACIONES ELECTROMECÁNICAS' THEN 7
    WHEN name = 'INSTALACIONES INDUSTRIALES' THEN 8
    WHEN name = 'INSTALACIONES TÉRMICAS' THEN 9
    WHEN name = 'LABORATORIO DE ENSAYOS INDUSTRIALES' THEN 10
    WHEN name = 'LABORATORIO DE MEDICIONES ELÉCTRICAS I - II' THEN 11
    WHEN name = 'LEGISLACIÓN DEL TRABAJO' THEN 12
    WHEN name = 'MANTENIMIENTO Y REPARACIÓN DE EQUIPOS' THEN 13
    WHEN name = 'MAQUINAS ELECTRICAS Y ENSAYOS' THEN 14
    WHEN name = 'MAQUINAS HIDRAULICAS' THEN 15
    WHEN name = 'MECÁNICA TÉCNICA' THEN 16
    WHEN name = 'METALURGIA Y TECNOLOGÍA MECÁNICA' THEN 17
    WHEN name = 'NEUMÁTICA - OLEODINAMICA' THEN 18
    WHEN name = 'ORGANIZACIÓN INDUSTRIAL I - II' THEN 19
    WHEN name = 'RELACIONES HUMANAS' THEN 20
    WHEN name = 'SEGURIDAD E HIGIENE INDUSTRIAL' THEN 21
    WHEN name = 'TECNOLOGÍA DE LA FABRICACIÓN' THEN 22
    WHEN name = 'TERMODINAMICA Y MAQUINAS TERMICAS' THEN 23
END
WHERE school_id = (SELECT id FROM public.schools WHERE name = 'ENET nro 1')
AND specialty = 'electromecanica';

-- 6. Reordenar materias de CONSTRUCCIÓN (orden alfabético)
UPDATE public.subjects 
SET display_order = CASE 
    WHEN name = 'ADMINISTRACIÓN Y CONDUCCIÓN DE OBRAS' THEN 1
    WHEN name = 'ARQUITECTURA I - II' THEN 2
    WHEN name = 'CÓMPUTOS Y PRESUPUESTOS' THEN 3
    WHEN name = 'CONSTRUCCIONES COMPLEMENTARIAS' THEN 4
    WHEN name = 'CONSTRUCCIONES DE ALBAÑILERÍA Y FUNDACIÓN' THEN 5
    WHEN name = 'CONSTRUCCIONES METÁLICAS Y DE MADERA' THEN 6
    WHEN name = 'DIBUJO TÉCNICO (CSC)' THEN 7
    WHEN name = 'ESTRUCTURAS I-II-III' THEN 8
    WHEN name = 'LEGISLACIÓN DE LA CONSTRUCCIÓN' THEN 9
    WHEN name = 'MATERIALES DE CONSTRUCCIÓN' THEN 10
    WHEN name = 'OBRAS SANITARIAS' THEN 11
    WHEN name = 'PROYECTOS I - II' THEN 12
    WHEN name = 'TOPOGRAFÍA Y OBRAS VIALES' THEN 13
    WHEN name = 'TRABAJO PRACTICO DE ESTRUCTURAS I-II' THEN 14
    WHEN name = 'TRABAJO PRÁCTICO DE PROYECTO FINAL' THEN 15
    WHEN name = 'VISITA DE OBRAS' THEN 16
END
WHERE school_id = (SELECT id FROM public.schools WHERE name = 'ENET nro 1')
AND specialty = 'construccion';

-- 7. Agregar columna display_order a administrative_positions si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'administrative_positions' 
        AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.administrative_positions ADD COLUMN display_order INTEGER;
    END IF;
END $$;

-- 8. Reordenar cargos administrativos (orden alfabético)
UPDATE public.administrative_positions 
SET display_order = CASE 
    WHEN name = 'ASESOR/A PEDAGÓGICO/A' THEN 1
    WHEN name = 'AYUDANTE TÉCNICO DE TRABAJOS PRÁCTICOS' THEN 2
    WHEN name = 'DIRECTOR/A' THEN 3
    WHEN name = 'JEFE GENERAL DE TALLERES' THEN 4
    WHEN name = 'JEFE SECCIÓN CONSTRUCCIONES' THEN 5
    WHEN name = 'JEFE SECCIÓN ELECTRICIDAD' THEN 6
    WHEN name = 'JEFE SECCIÓN MECÁNICA' THEN 7
    WHEN name = 'MEP CONSTRUCCIONES' THEN 8
    WHEN name = 'MEP ELECTRICIDAD' THEN 9
    WHEN name = 'MEP INFORMÁTICA' THEN 10
    WHEN name = 'MEP MECÁNICA Y AJUSTE' THEN 11
    WHEN name = 'PROSECRETARIO/A' THEN 12
    WHEN name = 'REGENTE DE CULTURA GENERAL' THEN 13
    WHEN name = 'REGENTE DE CULTURA TÉCNICA' THEN 14
    WHEN name = 'SECRETARIO/A' THEN 15
    WHEN name = 'VICEDIRECTOR/A' THEN 16
END
WHERE school_id = (SELECT id FROM public.schools WHERE name = 'ENET nro 1');

-- 9. Verificar que las nuevas materias se agregaron correctamente
SELECT 
    'Nuevas materias agregadas' as info,
    s.name,
    s.specialty,
    s.display_order
FROM public.subjects s
JOIN public.schools sch ON s.school_id = sch.id
WHERE sch.name = 'ENET nro 1'
AND s.name IN ('DIBUJO TÉCNICO (CB)', 'DIBUJOS Y ELEMENTOS DE MÁQUINAS')
ORDER BY s.specialty, s.display_order;

-- 10. Verificar el orden de todas las materias
SELECT 
    'Materias ordenadas por especialidad' as info,
    s.specialty,
    s.name,
    s.display_order
FROM public.subjects s
JOIN public.schools sch ON s.school_id = sch.id
WHERE sch.name = 'ENET nro 1'
ORDER BY s.specialty, s.display_order;
