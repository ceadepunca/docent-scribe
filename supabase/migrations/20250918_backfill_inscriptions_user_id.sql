-- Backfill de inscriptions.user_id con profiles.user_id cuando exista
-- Alinea inscripciones creadas contra profiles.id (importadas) hacia el auth user_id real
UPDATE public.inscriptions i
SET user_id = p.user_id
FROM public.profiles p
WHERE i.user_id = p.id
  AND p.user_id IS NOT NULL
  AND i.user_id <> p.user_id;

-- Opcional: reporte rápido de cuántas filas quedaron aún sin auth user_id
-- SELECT COUNT(*) 
-- FROM public.inscriptions i
-- JOIN public.profiles p ON i.user_id = p.id
-- WHERE p.user_id IS NULL;


