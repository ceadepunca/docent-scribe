-- Crea un índice único para inscription_id y position_selection_id en evaluations
CREATE UNIQUE INDEX IF NOT EXISTS evaluations_inscription_position_unique
ON evaluations (inscription_id, position_selection_id);

-- Alternativamente, si prefieres una restricción UNIQUE explícita (solo una de las dos es necesaria):
-- ALTER TABLE evaluations
-- ADD CONSTRAINT evaluations_inscription_position_unique UNIQUE (inscription_id, position_selection_id);
