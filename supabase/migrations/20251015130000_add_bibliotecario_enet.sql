DO $$
DECLARE
    enet_school_id UUID;
BEGIN
    -- Find the school ID for ENET, being specific with the name
    SELECT id INTO enet_school_id
    FROM schools
    WHERE name = 'ENET nro 1'
    LIMIT 1;

    -- If the school is found, insert the new position if it doesn't exist
    IF enet_school_id IS NOT NULL THEN
        -- Insert "BIBLIOTECARIO" if it doesn't already exist for this school
        INSERT INTO administrative_positions (name, school_id, is_active)
        SELECT 'BIBLIOTECARIO', enet_school_id, true
        WHERE NOT EXISTS (
            SELECT 1
            FROM administrative_positions
            WHERE name = 'BIBLIOTECARIO'
            AND school_id = enet_school_id
        );
    ELSE
        RAISE NOTICE 'ENET school not found.';
    END IF;
END $$;
