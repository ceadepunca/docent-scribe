-- Consulta los valores válidos del enum inscription_status
SELECT unnest(enum_range(NULL::inscription_status));

-- También puedes ver los valores usados actualmente en la tabla:
SELECT DISTINCT status FROM public.inscriptions ORDER BY status;
