# Documentación Técnica y Funcional del Sistema de Inscripciones Docentes

## 1. Stack Tecnológico

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

| Tabla | Propósito |
|---|---|
| `inscription_history` | Historial de cambios de estado de inscripciones |
| `inscription_documents` | Documentos adjuntos a inscripciones (bucket: `inscription-documents`) |
| `profile_documents` | Documentos del perfil: DNI frente/dorso, títulos PDF (bucket: `profile-documents`) |
| `inscription_deletion_requests` | Solicitudes de eliminación de inscripción por el docente |
| `email_change_requests` | Solicitudes de cambio de email |
| `teacher_registrations` | Registro de legajos docentes con código autogenerado |
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
| `super_admin` | Todo: gestionar períodos, usuarios, inscripciones asistidas, importaciones, backup |

Implementado vía tabla `user_roles` + función `has_role()` (SECURITY DEFINER) usada en todas las RLS policies.

---

## 4. Flujos Principales

### 4.1 Registro y Login
1. Admin crea usuario (o importa vía Google Forms/CSV)
2. Se genera email interno, password temporal `123456`
3. Docente ingresa con **DNI + password** (Login.tsx busca email por DNI)
4. Si `requires_password_change = true` en metadata, redirige a `/change-password`
5. Luego accede al Dashboard

### 4.2 Completar Perfil
1. Docente accede a `/profile`
2. Campos obligatorios: nombre, apellido, email, teléfono, título 1 (nombre + fecha egreso + promedio)
3. Hasta 4 títulos opcionales
4. Sube documentos: DNI frente, DNI dorso, títulos PDF
5. `useProfileCompleteness` calcula % de completitud; el Dashboard lo muestra

### 4.3 Inscripción (Docente)
1. Dashboard muestra períodos activos filtrados por nivel
2. Según nivel:
   - **Secundario** → `SecondaryInscriptionWizard`: wizard de pasos donde selecciona materias y cargos por escuela
   - **Inicial** → `InicialInscriptionWizard`: wizard similar adaptado a nivel inicial
   - **Primario** → Formulario simple (`InscriptionForm`)
3. Se guardan: inscripción + `inscription_subject_selections` + `inscription_position_selections`
4. Estado inicial: `draft` → al enviar pasa a `submitted`
5. Constraint `unique_user_inscription_per_period`: una inscripción por usuario por período
6. Trigger `validate_inscription_period`: valida período activo y nivel (bypass para super_admin)
7. Docente puede subir documentos a la inscripción (`InscriptionDocumentUploader`)

### 4.4 Evaluación
1. Evaluador accede a `/inscription-management` → lista inscripciones por período
2. Filtra por estado (enviada, evaluada, pendiente)
3. Click en inscripción → `/inscriptions/:id` → `InscriptionDetail`
4. Grilla de evaluación (`EvaluationGrid`) con 10 rubros de puntaje por cada materia/cargo seleccionado
5. Puntajes: título, antigüedad título, antigüedad docente, concepto, promedio título, trabajo público, becas/otros, concurso, otros antecedentes, red federal
6. Se guarda vía función `upsert_evaluation` (ON CONFLICT por inscription_id + position_selection_id)
7. `ConsolidatedEvaluationGrid`: vista consolidada de todas las evaluaciones
8. Navegación entre inscripciones con `useEvaluationNavigation` (siguiente, siguiente sin evaluar)

### 4.5 Listados / Ranking
1. Evaluador/Admin accede a `/listings`
2. Filtros: período, escuela, tipo (materias/cargos/todo), estado evaluación
3. `useListingData` cruza: selecciones de materias/cargos + perfiles + evaluaciones
4. Ordenamiento jerárquico:
   - Materias: por especialidad (ciclo básico > electromecánica > construcción), luego por nombre, luego por puntaje
   - Cargos: por jerarquía (Director > Vice Director > Secretario > Pro Secretario), luego por puntaje
5. `ListingTable` renderiza la tabla con export (CSV implícito vía `ListingGenerator`)

---

## 5. Pantallas

| Ruta | Componente | Rol | Descripción |
|---|---|---|---|
| `/` | Index | Público | Landing page |
| `/login` | Login | Público | Login por DNI + password |
| `/register` | Register | Público | Registro (email + password) |
| `/change-password` | ChangePassword | Autenticado | Cambio obligatorio de password |
| `/dashboard` | Dashboard | Autenticado | Panel principal con tarjetas por rol |
| `/profile` | Profile | Autenticado | Editar perfil + documentos + títulos |
| `/inscriptions` | Inscriptions | docente/admin/evaluator | Lista de inscripciones |
| `/inscriptions/new` | NewInscription | docente | Crear inscripción (wizard o form) |
| `/inscriptions/:id` | InscriptionDetail | docente/admin/evaluator | Detalle + evaluación |
| `/inscriptions/:id/edit` | EditInscription | docente/admin/evaluator | Editar inscripción |
| `/inscription-management` | InscriptionManagement | evaluator/admin | Gestión de inscripciones por período |
| `/listings` | Listings | evaluator/admin | Generación de listados/ranking |
| `/admin` | AdminPanel | super_admin | Períodos, solicitudes, importaciones, backup |
| `/admin/assisted-inscription` | AssistedInscription | super_admin | Inscripción asistida (admin crea por docente) |
| `/admin/bulk-inscription` | BulkInscription | super_admin | Inscripción masiva |
| `/unauthorized` | Unauthorized | — | Acceso denegado |

---

## 6. Edge Functions

| Función | Propósito |
|---|---|
| `admin-user-operations` | Operaciones admin sobre usuarios |
| `approve-email-change` | Aprobar cambio de email |
| `create-migrated-users` | Crear usuarios migrados desde datos importados |
| `fix-invalid-emails` | Corregir emails inválidos |
| `reset-user-password` | Reset de password a `123456` |

---

## 7. Reglas y Workflows Configurados

- **Trigger `validate_inscription_period`**: en INSERT de inscripciones, valida período activo + fechas + nivel. Super admins bypassean.
- **Trigger `handle_inscription_status_change`**: en UPDATE de inscripciones, registra historial en `inscription_history`.
- **Trigger `handle_new_user`**: en INSERT en `auth.users`, crea perfil y asigna rol `docente`.
- **Trigger `update_updated_at_column`**: actualiza `updated_at` automáticamente.
- **Función `generate_legajo_code`**: genera códigos de legajo secuenciales (4101+ para secundario, prefijo+secuencia para otros).
- **Función `safe_delete_position_selection`**: impide eliminar selecciones con evaluaciones vinculadas.
- **Función `upsert_evaluation`**: insert or update de evaluación con conflict resolution.
- **Constraint `unique_user_inscription_per_period`**: una inscripción por usuario por período.

---

## 8. Storage

| Bucket | Uso |
|---|---|
| `profile-documents` | DNI frente/dorso, PDFs de títulos (público) |
| `inscription-documents` | Documentos adjuntos a inscripciones (público) |

---

## 9. Hooks Principales

| Hook | Función |
|---|---|
| `useInscriptionPeriods` | Períodos activos y disponibles por nivel |
| `useSecondaryInscriptionData` | Guardar selecciones de materias/cargos |
| `useListingData` | Generar listados cruzando selecciones + perfiles + evaluaciones |
| `usePeriodInscriptions` | Inscripciones paginadas por período |
| `useProfileCompleteness` | Calcular completitud del perfil |
| `useProfileDocuments` | CRUD documentos del perfil |
| `useInscriptionDocuments` | CRUD documentos de inscripción |
| `useDeletionRequests` | Solicitudes de eliminación de inscripción |
| `useEmailChangeRequests` | Solicitudes de cambio de email |
| `useEvaluationNavigation` | Navegación entre inscripciones durante evaluación |
| `useTeacherManagement` | Gestión de docentes (admin) |
| `useBackupRestore` | Export/import backup JSON |
| `useGoogleFormsImport` | Importar datos desde Google Forms |
| `useBulkInscription` | Inscripción masiva |
