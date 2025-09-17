-- Update evaluations table to allow 2 decimal places for better precision
-- First drop the generated column total_score, then alter column types, then recreate it

-- Drop the generated column first
ALTER TABLE public.evaluations DROP COLUMN total_score;

-- Change score columns from numeric(3,1) to numeric(4,2)
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
  ALTER COLUMN red_federal_score TYPE numeric(4,2);

-- Recreate the total_score column as a regular column (not generated) with proper precision
ALTER TABLE public.evaluations ADD COLUMN total_score numeric(5,2);