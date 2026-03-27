# Rediseño: Ejercicios, Rutinas y Plan

**Fecha:** 2026-03-27
**Estado:** Aprobado

---

## Problema

El modelo actual acopla `Routine` a `Phase`, lo que impide reutilizar rutinas entre programas. El flujo de creación (wizard multi-paso) mezcla en una sola pantalla lo que conceptualmente son tres pasos distintos: definir ejercicios, construir rutinas, y planificar la semana.

---

## Decisiones de diseño

1. **Rutinas globales con overrides por programa** — una rutina se crea una vez y se puede asignar a múltiples programas/fases. Los parámetros que difieren del base se guardan como `ExerciseOverride` en el `ProgramDay`.
2. **Asignación de días manual** con herramientas de productividad (selector de días + cuántas semanas repetir). La alternancia ABA/BAB se hace manualmente.
3. **Importación de ejercicios** vía JSON/CSV con preview antes de confirmar.
4. **Navegación** consolidada bajo `/training` con 3 tabs: Ejercicios, Rutinas, Plan.

---

## Nuevo Schema

### Modelos que desaparecen / cambian

- `Routine.phaseId` **desaparece** — Routine pasa a ser global (user-scoped).
- El wizard de programa en `/training/program/new` **desaparece**.

### Modelos nuevos / modificados

```prisma
// Rutina global del usuario (sin Phase)
model Routine {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  sessionType SessionType
  durationMin Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  exercises   RoutineExercise[]
  programDays ProgramDay[]

  @@index([userId])
}

// Parámetros base de ejercicio en una rutina
model RoutineExercise {
  id         String   @id @default(cuid())
  routineId  String
  routine    Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])

  order  Int
  block  String?  // "calentamiento", "principal", "enfriamiento"
  sets   Int?
  reps   Int?
  durationSec Int?
  restSec     Int?
  tempo       String?
  rpe         Int?
  notes       String?

  createdAt DateTime @default(now())

  @@unique([routineId, order])
  @@index([routineId])
}

// Día de una fase con rutina asignada
model ProgramDay {
  id         String  @id @default(cuid())
  phaseId    String
  phase      Phase   @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  routineId  String
  routine    Routine @relation(fields: [routineId], references: [id])

  dayOfWeek  String  // "monday" | "tuesday" | ... | "sunday"
  weekNumber Int?    // null = aplica a todas las semanas de la fase

  createdAt DateTime @default(now())

  overrides ExerciseOverride[]

  @@index([phaseId])
}

// Parámetros que difieren del base para este ProgramDay
model ExerciseOverride {
  id           String     @id @default(cuid())
  programDayId String
  programDay   ProgramDay @relation(fields: [programDayId], references: [id], onDelete: Cascade)
  exerciseId   String
  exercise     Exercise   @relation(fields: [exerciseId], references: [id])

  sets    Int?
  reps    Int?
  durationSec Int?
  restSec     Int?
  tempo   String?
  rpe     Int?
  notes   String?

  @@index([programDayId])
}
```

### Phase (sin cambios estructurales)

```prisma
model Phase {
  id          String  @id @default(cuid())
  programId   String
  program     Program @relation(...)
  name        String
  order       Int
  weekStart   Int
  weekEnd     Int
  description String?
  rpeTarget   String?
  tempoDefault String?
  benchmarks  String?

  programDays ProgramDay[]  // ← antes era routines Routine[]
}
```

---

## Rutas

```
/training                                    → redirect a /training/exercises
/training/exercises                          ← tab 1: catálogo
/training/exercises/new                      ← crear ejercicio
/training/exercises/[id]                     ← detalle + historial
/training/exercises/import                   ← importar JSON/CSV

/training/routines                           ← tab 2: lista de rutinas
/training/routines/new                       ← crear rutina
/training/routines/[id]                      ← detalle + editar

/training/plan                               ← tab 3: programa activo
/training/plan/new                           ← crear programa
/training/plan/[programId]                   ← ver programa
/training/plan/[programId]/phase/[phaseId]   ← editar días de fase
```

**Rutas eliminadas:**
- `/exercises` y `/exercises/[id]`
- `/training/program/new`

---

## Pantallas

### `/training/exercises`
- Grid de tarjetas con filtros (búsqueda, grupo muscular, tipo de movimiento)
- Botón `[+ Crear]` → `/training/exercises/new`
- Botón `[↑ Importar]` → modal con preview de CSV/JSON antes de confirmar
- El formulario de ejercicio incluye: nombre, slug (auto), grupo muscular, tipo de movimiento, categoría, dificultad, parámetros por defecto, datos de seguridad, jerarquía (parent para regresión/progresión)

### `/training/routines`
- Lista de rutinas del usuario con: nombre, tipo de sesión, duración, cantidad de ejercicios, última fecha ejecutada
- Click → detalle con ejercicios agrupados por bloque (calentamiento / principal / enfriamiento)
- Edición inline de parámetros base por ejercicio
- Reordenar ejercicios con drag & drop

### `/training/plan`
- Muestra el programa activo con sus fases
- Cada fase muestra la semana como grilla LUN–DOM con la rutina asignada a cada día
- Click en un día → drawer lateral para asignar/cambiar rutina y agregar overrides de ejercicios
- Herramienta de asignación rápida: seleccionar múltiples días + cuántas semanas aplicar

---

## Flujo de datos en sesión activa

```
GET /api/daily-log/today
  1. Obtener fecha actual
  2. Buscar Program activo del usuario
  3. Encontrar Phase activa según semana actual
  4. Buscar ProgramDay que coincida con dayOfWeek (y weekNumber si aplica)
  5. Cargar Routine → RoutineExercise[] (parámetros base)
  6. Cargar ExerciseOverride[] del ProgramDay
  7. Merge: base + overrides → parámetros efectivos
  8. Retornar junto con DailyLog existente (o null)
```

---

## Importación CSV/JSON

**Formato CSV esperado:**
```csv
name,muscleGroup,movementType,category,difficulty,defaultSets,defaultReps,defaultRestSec
Sentadilla,LEGS,SQUAT,STANDARD,2,3,10,90
Flexiones,CHEST,PUSH,STANDARD,1,3,8,60
```

**Formato JSON esperado:**
```json
[
  {
    "name": "Sentadilla",
    "muscleGroup": "LEGS",
    "movementType": "SQUAT",
    "category": "STANDARD",
    "difficulty": 2,
    "defaultSets": 3,
    "defaultReps": 10,
    "defaultRestSec": 90
  }
]
```

- Preview en tabla antes de confirmar
- Validación con Zod antes de insertar
- Reporte de errores por fila (no detiene las filas válidas)
- Detección de duplicados por `name` (opción: omitir o actualizar)

---

## Lo que no cambia

- `Exercise` — sin cambios
- `DailyLog` — sigue apuntando a `routineId`
- `ExerciseLog` — sin cambios
- `BodyMeasurement` — sin cambios
- Auth — sin cambios
- Vistas de calendario (`/training` con semana/mes/año) — sin cambios funcionales, solo ajuste de queries
