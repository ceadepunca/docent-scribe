
El usuario reporta que el botón "Exportar PDF" en `/listings` no funciona. Mirando `ListingGenerator.tsx`, el botón existe pero no tiene `onClick` — es solo decorativo.

# Plan: Implementar exportación a PDF en Listados

## Problema
En `src/components/ListingGenerator.tsx` el botón "Exportar PDF" no tiene handler. Es puramente visual.

## Solución

### 1. Agregar dependencias
- `jspdf` + `jspdf-autotable` para generar el PDF con tablas estilo grilla.

### 2. Modificar `src/components/ListingGenerator.tsx`
- Crear función `handleExportPDF()` que:
  - Genera un PDF en orientación horizontal (landscape) por la cantidad de columnas.
  - Encabezado con: título "Listado de Mérito", período, escuela, fecha de generación.
  - Tabla con columnas: Orden, Apellido y Nombre, DNI, Título, Antigüedad título, Antigüedad docente, Concepto, Promedio, Trabajo público, Becas/otros, Concurso, Otros antecedentes, Red federal, **Total**.
  - Una sección por agrupamiento (materia o cargo) si el listado incluye varios.
  - Pie con número de página.
  - Nombre del archivo: `listado-merito-{periodo}-{fecha}.pdf`.
- Agregar `onClick={handleExportPDF}` al botón existente.
- Mantener disabled cuando `listings.length === 0`.

### 3. (Opcional, mismo cambio) Agregar export a CSV
- Botón secundario que descargue CSV con las mismas columnas, usando `Blob` + `URL.createObjectURL`. Útil para Excel.

## Lo que NO se modifica
- Estructura de datos de `useListingData`.
- `ListingTable.tsx` (la vista en pantalla queda igual).
- Backend / base de datos.
