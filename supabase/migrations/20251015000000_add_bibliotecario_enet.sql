-- Insert BIBLIOTECARIO for ENET nro 1 (idempotent)
DO $$
DECLARE
    enet_school_id UUID;
BEGIN
    SELECT id INTO enet_school_id
    FROM public.schools
    WHERE name ILIKE 'ENET%1%' OR name ILIKE 'ENET nro 1' OR name ILIKE 'ENET nro 1%'
    LIMIT 1;

    IF enet_school_id IS NOT NULL THEN
        INSERT INTO public.administrative_positions (name, school_id, is_active, created_at, updated_at)
        SELECT 'BIBLIOTECARIO', enet_school_id, true, now(), now()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.administrative_positions ap
            WHERE ap.name ILIKE 'bibliotecario' AND ap.school_id = enet_school_id
        );
    ELSE
        RAISE NOTICE 'ENET school not found, skipping insertion of BIBLIOTECARIO.';
    END IF;
END $$;
