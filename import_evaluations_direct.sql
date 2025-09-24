-- Script para importar evaluaciones directamente desde Excel/CSV
-- Ejecutar en Supabase Dashboard -> SQL Editor

-- IMPORTANTE: Reemplaza los valores de ejemplo con los datos reales de tu Excel
-- Este script importa evaluaciones para docentes que ya tienen inscripciones con posición PRECEPTOR/A

-- 1. Crear tabla temporal para los datos de importación
CREATE TEMP TABLE temp_imported_evaluations (
    legajo TEXT,
    titulo_score NUMERIC,
    antiguedad_titulo_score NUMERIC,
    antiguedad_docente_score NUMERIC,
    concepto_score NUMERIC,
    promedio_titulo_score NUMERIC,
    trabajo_publico_score NUMERIC,
    becas_otros_score NUMERIC,
    concurso_score NUMERIC,
    otros_antecedentes_score NUMERIC,
    red_federal_score NUMERIC,
    total_score NUMERIC
);

-- 2. Insertar datos de ejemplo (REEMPLAZA CON TUS DATOS REALES)
-- Formato: INSERT INTO temp_imported_evaluations VALUES ('LEGAJO', titulo, antiguedad_titulo, antiguedad_docente, concepto, promedio, trabajo_publico, becas, concurso, otros_antecedentes, red_federal, total);

-- Ejemplo para ISAAC NAZARETH VIEL (LEGAJO 415):
INSERT INTO temp_imported_evaluations VALUES 
('415', 9.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13.00);

-- Ejemplo para BRANDAN (LEGAJO 999):
INSERT INTO temp_imported_evaluations VALUES 
('999', 9.00, 2.00, 2.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 13.00);

-- Agrega más filas aquí con los datos de tu Excel...
-- INSERT INTO temp_imported_evaluations VALUES ('LEGAJO', titulo, antiguedad_titulo, antiguedad_docente, concepto, promedio, trabajo_publico, becas, concurso, otros_antecedentes, red_federal, total);

-- 3. Verificar los datos insertados
SELECT 
    'Datos a importar' as info,
    legajo,
    titulo_score,
    total_score
FROM temp_imported_evaluations
ORDER BY legajo;

-- 4. Importar evaluaciones (INSERT o UPDATE según corresponda)
WITH evaluation_data AS (
    SELECT 
        t.legajo,
        t.titulo_score,
        t.antiguedad_titulo_score,
        t.antiguedad_docente_score,
        t.concepto_score,
        t.promedio_titulo_score,
        t.trabajo_publico_score,
        t.becas_otros_score,
        t.concurso_score,
        t.otros_antecedentes_score,
        t.red_federal_score,
        t.total_score,
        i.id as inscription_id,
        ips.id as position_selection_id
    FROM temp_imported_evaluations t
    JOIN profiles p ON p.dni = t.legajo
    JOIN inscriptions i ON i.user_id = p.id AND i.teaching_level = 'secundario'
    JOIN inscription_position_selections ips ON ips.inscription_id = i.id
    JOIN administrative_positions ap ON ap.id = ips.administrative_position_id
    JOIN schools s ON s.id = ap.school_id
    WHERE ap.name = 'PRECEPTOR/A' AND s.name = 'Fray M Esquiú'
)
INSERT INTO evaluations (
    inscription_id,
    evaluator_id,
    position_selection_id,
    titulo_score,
    antiguedad_titulo_score,
    antiguedad_docente_score,
    concepto_score,
    promedio_titulo_score,
    trabajo_publico_score,
    becas_otros_score,
    concurso_score,
    otros_antecedentes_score,
    red_federal_score,
    total_score,
    status,
    title_type
)
SELECT 
    ed.inscription_id,
    'bc7f6941-a3f6-48c3-b5cd-b5734806231d'::uuid as evaluator_id, -- Reemplaza con tu user_id
    ed.position_selection_id,
    ed.titulo_score,
    ed.antiguedad_titulo_score,
    ed.antiguedad_docente_score,
    ed.concepto_score,
    ed.promedio_titulo_score,
    ed.trabajo_publico_score,
    ed.becas_otros_score,
    ed.concurso_score,
    ed.otros_antecedentes_score,
    ed.red_federal_score,
    ed.total_score,
    'draft' as status,
    'docente' as title_type
FROM evaluation_data ed
ON CONFLICT (inscription_id, position_selection_id) 
DO UPDATE SET
    titulo_score = EXCLUDED.titulo_score,
    antiguedad_titulo_score = EXCLUDED.antiguedad_titulo_score,
    antiguedad_docente_score = EXCLUDED.antiguedad_docente_score,
    concepto_score = EXCLUDED.concepto_score,
    promedio_titulo_score = EXCLUDED.promedio_titulo_score,
    trabajo_publico_score = EXCLUDED.trabajo_publico_score,
    becas_otros_score = EXCLUDED.becas_otros_score,
    concurso_score = EXCLUDED.concurso_score,
    otros_antecedentes_score = EXCLUDED.otros_antecedentes_score,
    red_federal_score = EXCLUDED.red_federal_score,
    total_score = EXCLUDED.total_score,
    status = 'draft',
    updated_at = NOW();

-- 5. Verificar las evaluaciones importadas
SELECT 
    'Evaluaciones importadas' as info,
    e.id,
    e.inscription_id,
    e.titulo_score,
    e.total_score,
    e.status,
    p.first_name,
    p.last_name,
    p.dni
FROM evaluations e
JOIN inscriptions i ON i.id = e.inscription_id
JOIN profiles p ON p.id = i.user_id
WHERE e.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY e.created_at DESC;

-- 6. Limpiar tabla temporal
DROP TABLE temp_imported_evaluations;

