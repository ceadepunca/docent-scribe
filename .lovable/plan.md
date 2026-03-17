

# Plan: Migrar de `available_levels` (array) a `level` (text) en inscription_periods

## Contexto
La columna `level` (text) ya existe en `inscription_periods` y tiene datos ("secundario", "inicial"). El cambio es puramente en el frontend: reemplazar todas las referencias a `available_levels` por `level`.

## Archivos a modificar

### 1. `src/hooks/useInscriptionPeriods.tsx` y `useInscriptionPeriodsLegacy.tsx`
- Cambiar interface `InscriptionPeriod`: reemplazar `available_levels: array` por `level: 'inicial' | 'primario' | 'secundario'`
- `getPeriodForLevel`: cambiar `period.available_levels.includes(level)` → `period.level === level`
- `getAvailableLevelsForUser`: en vez de iterar `available_levels`, extraer `period.level` de cada período actual

### 2. `src/pages/AdminPanel.tsx`
- Cambiar `periodForm.availableLevels` (array) → `periodForm.level` (string simple)
- Reemplazar checkboxes por un `<Select>` dropdown con opciones: inicial, primario, secundario
- En `createPeriod`: enviar `level: periodForm.level` además de `available_levels: [periodForm.level]` (compatibilidad)
- Eliminar `handleLevelChange`

### 3. `src/components/PeriodSelectionGrid.tsx`
- Actualizar interface: `level` en vez de `available_levels`
- Filtro: `period.level === teachingLevel` en vez de `period.available_levels.includes(teachingLevel)`

### 4. `src/components/admin/PeriodInscriptionsView.tsx`
- Línea ~197: cambiar `selectedPeriod.available_levels.join(', ')` → `selectedPeriod.level`

### 5. `src/components/admin/InscriptionPreview.tsx`
- Línea ~108: cambiar `selectedPeriod.available_levels.includes(...)` → `selectedPeriod.level === inscriptionConfig.teaching_level`

### 6. `src/components/admin/BulkInscriptionForm.tsx`
- Línea ~166: cambiar `selectedPeriod.available_levels.includes(...)` → `selectedPeriod.level === formData.teaching_level`

### 7. `src/pages/admin/AssistedInscription.tsx`
- Líneas ~80, 90, 99: cambiar `period.available_levels.includes(...)` → `period.level === teachingLevel`

### 8. `src/components/ListingGenerator.tsx`
- Si muestra nivel del período, usar `period.level`

## Lo que NO se modifica
- Tabla `inscription_periods` (no se elimina `available_levels`)
- Tabla `inscriptions` ni ninguna otra tabla
- Trigger `validate_inscription_period` (sigue usando `available_levels` en SQL — funciona porque se sigue enviando)
- `src/integrations/supabase/types.ts` (no se edita manualmente)

## Compatibilidad
Al crear períodos, se enviará tanto `level` como `available_levels: [level]` para que el trigger de validación siga funcionando sin cambios en la base de datos.

