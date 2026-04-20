
El usuario quiere agregar exportación a XLSX (Excel) además del PDF y CSV existentes en el generador de listados.

# Plan: Agregar exportación a XLSX en Listados

## Cambios

### 1. Dependencia
- Agregar `xlsx` (SheetJS) al proyecto.

### 2. `src/components/ListingGenerator.tsx`
- Importar `* as XLSX from 'xlsx'`.
- Crear `handleExportXLSX()` que:
  - Reutiliza la misma lógica de agrupamiento (`groupListingsForExport`) que PDF y CSV.
  - Genera **una hoja por escuela** dentro del workbook, con:
    - Título de la escuela.
    - Secciones "MATERIAS" y "CARGOS ADMINISTRATIVOS".
    - Sub-secciones por materia/cargo y tipo de título (Doc/Hab/Sup).
    - Tabla con las mismas columnas que el PDF: #, Apellido y Nombre, DNI, Tipo, Tít., Ant.Tít., Ant.Doc., Conc., Prom., T.Pub., Becas, Conc., Otros, R.Fed., **TOTAL**.
  - Formato:
    - Encabezados en negrita.
    - Fila TOTAL destacada.
    - Anchos de columna ajustados (apellido y nombre más ancho, scores angostos).
  - Nombre del archivo: `listado-merito-{periodo}-{fecha}.xlsx`.
- Agregar tercer botón "Exportar Excel" junto a PDF y CSV (icono `FileSpreadsheet` ya importado, usar otro como `Sheet` o reusar). Mantener disabled cuando `listings.length === 0`.

## Lo que NO se modifica
- Lógica de PDF y CSV (siguen funcionando igual).
- `useListingData`, `ListingTable`, ni el backend.
