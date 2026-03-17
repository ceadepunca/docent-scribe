

# Documentacion Tecnica y Funcional del Sistema de Inscripciones Docentes

## 1. Stack Tecnologico

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management:** React Context (AuthContext) + TanStack Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation

---

## 2. Entidades (Tablas)

```text
┌──────────────────────────────┐     ┌──────────────────────────┐
│         profiles             │     │       user_roles         │
│──────────────────────────────│     │──────────────────────────│
│ id (uuid, PK = auth.users)  │◄───►│ user_id (uuid, FK)       │
│ user_id (uuid, nullable)    │     │ role (app_role enum)      │
│ first_name, last_name       │     │   super_admin | evaluator │
│ email, phone, dni           │     │   | docente              │
│ titulo_1..4_nombre           │     └──────────────────────────┘
│ titulo_1..4_fecha_egreso     │
│ titulo_1..4_promedio         │
│ migrated, data_complete      │
│ legajo_number                │
└──────────────────────────────┘
         │
         │ user_id
         ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│       inscriptions           │────►│     inscription_periods      │
│──────────────────────────────│     │──────────────────────────────│
│ id, user_id                  │     │ id, name, description        │
│ teaching_level (enum:        │     │ start_date, end_date         │
│   inicial|primario|secundario│     │ is_active                    │
│ status (enum: draft|         │     │ available_levels (array)     │
│   submitted|under_review|    │     │ created_by                   │
│   approved|rejected|         │     └──────────────────────────────┘
│   requires_changes)          │
│ inscription_period_id        │
│ subject_area                 │
│ experience_years             │
└──────────┬───────────────────┘
           │
     ┌─────┴─────────────────────────┐
     │                               │
     ▼                               ▼
┌────────────────────────┐  ┌─────────────────────────────┐
│inscription_subject_    │  │inscription_position_        │
│   selections           │  │   selections                │
│────────────────────────│  │─────────────────────────────│
│ id, inscription_id     │  │ id, inscription_id          │
│ subject_id (FK)        │  │ administrative_position_id  │
│ position_type (text)   │  │                             │
└────────┬───────────────┘  └─────────────┬───────────────┘
         │                                │
         ▼                                ▼
┌────────────────────┐         ┌──────────────────────────┐
│     subjects       │         │ administrative_positions  │
│────────────────────│         │──────────────────────────│
│ id, name           │         │ id, name                 │
│ school_id (FK)     │         │ school_id (FK)           │
│ specialty (text:   │         │ display_order            │
│  ciclo_basico|     │         └──────────────────────────┘
│  electromecanica|  │
│  construccion)     │
└────────────────────┘
                                    ┌──────────────────┐
         ┌─────────────────────────►│     schools      │
         │                          │──────────────────│
         │                          │ id, name         │
         │                          │ teaching_level   │
         │                          └──────────────────┘
         │
┌────────┴───────────────┐
│     evaluations        │
│────────────────────────│
│ id, inscription_id     │
│ evaluator_id           │
│ subject_selection_id   │  ← una evaluación por materia/cargo
│ position_selection_id  │
│ titulo_score           │  10 rubros de puntaje
│ antiguedad_titulo_score│
│ antiguedad_docente_score│
│ concepto_score         │
│ promedio_titulo_score  │
│ trabajo_publico_score  │
│ becas_otros_score      │
│ concurso_score         │
│ otros_antecedentes_score│
│ red_federal_score      │
│ total_score            │
│ status (draft|completed)│
│ title_type (docente|   │
│  habilitante|supletorio)│
└────────────────────────┘
```

**Tablas auxiliares:**

| Tabla | Proposito |
|---|---|
| `inscription_history` | Historial de cambios de estado de inscripciones |
| `inscription_documents` | Documentos adjuntos a inscripciones (bucket: `inscription-documents`) |
| `profile_documents` | Documentos del perfil: DNI frente/dorso, titulos PDF (bucket: `profile-documents`) |
| `inscription_deletion_requests` | Solicitudes de eliminacion de inscripcion por el docente |
| `email_change_requests` | Solicitudes de cambio de email |
| `teacher_registrations` | Registro de legajos docentes con codigo autogenerado |
| `position_types` | Tipos de cargo por nivel (ej: MS, MG para primario/inicial) |
| `schools` | Escuelas por nivel educativo |

**Vistas:**
- `inscriptions_with_evaluation_status` — inscripciones con conteo de evaluaciones
- `inscriptions_with_evaluations` — resumen de inscripciones con datos del docente

---

## 3. Roles y Permisos

| Rol | Acceso |
|---|---|
| `docente` | Perfil, crear/ver/editar sus inscripciones, subir documentos |
| `evaluator` | Ver todas las inscripciones, crear/editar evaluaciones, ver listados |
| `super_admin` | Todo: gestionar periodos, usuarios, inscripciones asistidas, importaciones, backup |

Implementado via tabla `user_roles` + funcion `has_role()` (SECURITY DEFINER) usada en todas las RLS policies.

---

## 4. Flujos Principales

### 4.1 Registro y Login
1. Admin crea usuario (o importa via Google Forms/CSV)
2. Se genera email interno, password temporal `123456`
3. Docente ingresa con **DNI + password** (Login.tsx busca email por DNI)
4. Si `requires_password_change = true` en metadata, redirige a `/change-password`
5. Luego accede al Dashboard

### 4.2 Completar Perfil
1. Docente accede a `/profile`
2. Campos obligatorios: nombre, apellido, email, telefono, titulo 1 (nombre + fecha egreso + promedio)
3. Hasta 4 titulos opcionales
4. Sube documentos: DNI frente, DNI dorso, titulos PDF
5. `useProfileCompleteness` calcula % de completitud; el Dashboard lo muestra

### 4.3 Inscripcion (Docente)
1. Dashboard muestra periodos activos filtrados por nivel
2. Segun nivel:
   - **Secundario** → `SecondaryInscriptionWizard`: wizard de pasos donde selecciona materias y cargos por escuela
   - **Inicial** → `InicialInscriptionWizard`: wizard similar adaptado a nivel inicial
   - **Primario** → Formulario simple (`InscriptionForm`)
3. Se guardan: inscripcion + `inscription_subject_selections` + `inscription_position_selections`
4. Estado inicial: `draft` → al enviar pasa a `submitted`
5. Constraint `unique_user_inscription_per_period`: una inscripcion por usuario por periodo
6. Trigger `validate_inscription_period`: valida periodo activo y nivel (bypass para super_admin)
7. Docente puede subir documentos a la inscripcion (`InscriptionDocumentUploader`)

### 4.4 Evaluacion
1. Evaluador accede a `/inscription-management` → lista inscripciones por periodo
2. Filtra por estado (enviada, evaluada, pendiente)
3. Click en inscripcion → `/inscriptions/:id` → `InscriptionDetail`
4. Grilla de evaluacion (`EvaluationGrid`) con 10 rubros de puntaje por cada materia/cargo seleccionado
5. Puntajes: titulo, antiguedad titulo, antiguedad docente, concepto, promedio titulo, trabajo publico, becas/otros, concurso, otros antecedentes, red federal
6. Se guarda via funcion `upsert_evaluation` (ON CONFLICT por inscription_id + position_selection_id)
7. `ConsolidatedEvaluationGrid`: vista consolidada de todas las evaluaciones
8. Navegacion entre inscripciones con `useEvaluationNavigation` (siguiente, siguiente sin evaluar)

### 4.5 Listados / Ranking
1. Evaluador/Admin accede a `/listings`
2. Filtros: periodo, escuela, tipo (materias/cargos/todo), estado evaluacion
3. `useListingData` cruza: selecciones de materias/cargos + perfiles + evaluaciones
4. Ordenamiento jerarquico:
   - Materias: por especialidad (ciclo basico > electromecanica > construccion), luego por nombre, luego por puntaje
   - Cargos: por jerarquia (Director > Vice Director > Secretario > Pro Secretario), luego por puntaje
5. `ListingTable` renderiza la tabla con export (CSV implícito via `ListingGenerator`)

---

## 5. Pantallas

| Ruta | Componente | Rol | Descripcion |
|---|---|---|---|
| `/` | Index | Publico | Landing page |
| `/login` | Login | Publico | Login por DNI + password |
| `/register` | Register | Publico | Registro (email + password) |
| `/change-password` | ChangePassword | Autenticado | Cambio obligatorio de password |
| `/dashboard` | Dashboard | Autenticado | Panel principal con tarjetas por rol |
| `/profile` | Profile | Autenticado | Editar perfil + documentos + titulos |
| `/inscriptions` | Inscriptions | docente/admin/evaluator | Lista de inscripciones |
| `/inscriptions/new` | NewInscription | docente | Crear inscripcion (wizard o form) |
| `/inscriptions/:id` | InscriptionDetail | docente/admin/evaluator | Detalle + evaluacion |
| `/inscriptions/:id/edit` | EditInscription | docente/admin/evaluator | Editar inscripcion |
| `/inscription-management` | InscriptionManagement | evaluator/admin | Gestion de inscripciones por periodo |
| `/listings` | Listings | evaluator/admin | Generacion de listados/ranking |
| `/admin` | AdminPanel | super_admin | Periodos, solicitudes, importaciones, backup |
| `/admin/assisted-inscription` | AssistedInscription | super_admin | Inscripcion asistida (admin crea por docente) |
| `/admin/bulk-inscription` | BulkInscription | super_admin | Inscripcion masiva |
| `/unauthorized` | Unauthorized | — | Acceso denegado |

---

## 6. Edge Functions

| Funcion | Proposito |
|---|---|
| `admin-user-operations` | Operaciones admin sobre usuarios |
| `approve-email-change` | Aprobar cambio de email |
| `create-migrated-users` | Crear usuarios migrados desde datos importados |
| `fix-invalid-emails` | Corregir emails invalidos |
| `reset-user-password` | Reset de password a `123456` |

---

## 7. Reglas y Workflows Configurados

- **Trigger `validate_inscription_period`**: en INSERT de inscripciones, valida periodo activo + fechas + nivel. Super admins bypassean.
- **Trigger `handle_inscription_status_change`**: en UPDATE de inscripciones, registra historial en `inscription_history`.
- **Trigger `handle_new_user`**: en INSERT en `auth.users`, crea perfil y asigna rol `docente`.
- **Trigger `update_updated_at_column`**: actualiza `updated_at` automaticamente.
- **Funcion `generate_legajo_code`**: genera codigos de legajo secuenciales (4101+ para secundario, prefijo+secuencia para otros).
- **Funcion `safe_delete_position_selection`**: impide eliminar selecciones con evaluaciones vinculadas.
- **Funcion `upsert_evaluation`**: insert or update de evaluacion con conflict resolution.
- **Constraint `unique_user_inscription_per_period`**: una inscripcion por usuario por periodo.

---

## 8. Storage

| Bucket | Uso |
|---|---|
| `profile-documents` | DNI frente/dorso, PDFs de titulos (publico) |
| `inscription-documents` | Documentos adjuntos a inscripciones (publico) |

---

## 9. Hooks Principales

| Hook | Funcion |
|---|---|
| `useInscriptionPeriods` | Periodos activos y disponibles por nivel |
| `useSecondaryInscriptionData` | Guardar selecciones de materias/cargos |
| `useListingData` | Generar listados cruzando selecciones + perfiles + evaluaciones |
| `usePeriodInscriptions` | Inscripciones paginadas por periodo |
| `useProfileCompleteness` | Calcular completitud del perfil |
| `useProfileDocuments` | CRUD documentos del perfil |
| `useInscriptionDocuments` | CRUD documentos de inscripcion |
| `useDeletionRequests` | Solicitudes de eliminacion de inscripcion |
| `useEmailChangeRequests` | Solicitudes de cambio de email |
| `useEvaluationNavigation` | Navegacion entre inscripciones durante evaluacion |
| `useTeacherManagement` | Gestion de docentes (admin) |
| `useBackupRestore` | Export/import backup JSON |
| `useGoogleFormsImport` | Importar datos desde Google Forms |
| `useBulkInscription` | Inscripcion masiva |

