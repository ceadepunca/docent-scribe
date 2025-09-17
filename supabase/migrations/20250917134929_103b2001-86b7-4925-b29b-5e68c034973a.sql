-- First, drop the generated column expression for total_score
-- Then update all score columns to allow 2 decimal places for better precision

-- Drop the generated column expression
ALTER TABLE public.evaluations 
  ALTER COLUMN total_score DROP EXPRESSION;

-- Update all score columns from numeric(3,1) to numeric(4,2)
ALTER TABLE public.evaluations 
  ALTER COLUMN titulo_score TYPE numeric(4,2),
  ALTER COLUMN antiguedad_titulo_score TYPE numeric(4,2),
  ALTER COLUMN antiguedad_docente_score TYPE numeric(4,2),
  ALTER COLUMN concepto_score TYPE numeric(4,2),
  ALTER COLUMN promedio_titulo_score TYPE numeric(4,2),
  ALTER COLUMN trabajo_publico_score TYPE numeric(4,2),
  ALTER COLUMN becas_otros_score TYPE numeric(4,2),
  ALTER COLUMN concurso_score TYPE numeric(4,2),
  ALTER COLUMN otros_antecedentes_score TYPE numeric(4,2),
  ALTER COLUMN red_federal_score TYPE numeric(4,2),
  ALTER COLUMN total_score TYPE numeric(5,2);