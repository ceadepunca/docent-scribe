-- Permitir valores nulos en changed_by para inscription_history
ALTER TABLE public.inscription_history
ALTER COLUMN changed_by DROP NOT NULL;
