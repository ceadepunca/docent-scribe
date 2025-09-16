-- Add missing PRECEPTOR/A ENET position
INSERT INTO public.administrative_positions (name, school_id)
SELECT 'PRECEPTOR/A ENET', s.id
FROM public.schools s
WHERE s.name = 'ENET nro 1' AND s.teaching_level = 'secundario';