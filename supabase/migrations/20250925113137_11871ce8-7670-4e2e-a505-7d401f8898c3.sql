-- Cambiar el status de todas las evaluaciones a 'draft' para que aparezcan como no evaluadas
UPDATE public.evaluations 
SET status = 'draft'
WHERE status = 'completed';