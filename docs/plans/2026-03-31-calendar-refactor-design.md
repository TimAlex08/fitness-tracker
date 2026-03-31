# Diseño: Refactorización Calendar-First

**Fecha:** 2026-03-31
**Estado:** Aprobado

---

## Resumen

Reestructuración completa de la app para hacer el calendario el eje central. Los programas se planifican con fechas reales, el registro de actividad se ancla a días concretos, y el usuario puede ver en un calendario real (mes/semana/día) todo lo que ha hecho y tiene planificado.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| ¿Cómo se asignan rutinas al calendario? | Patrón semanal recurrente por rutina + overrides individuales por fecha |
| ¿Múltiples programas activos? | No — un programa activo a la vez, con múltiples rutinas por día |
| ¿Jerarquía de planificación? | Collection → Program → ProgramRoutine (eliminando Phase/ProgramDay) |
| ¿Modelo de variantes? | ExerciseFamily con familyLevel numérico y familyRole (MAIN_PATH/VARIANT) |
| ¿Vista de entrada? | /today — lo que toca hoy, con acceso al calendario |
| ¿Sesiones ad-hoc? | Sí — cualquier rutina en cualquier día, distinguidas visualmente |
| ¿Datos existentes? | Reset completo — empezar desde cero con nuevo schema |
| ¿Métricas de progreso? | Progresión técnica (familyLevel, volumen, RPE) + consistencia (streaks, adherencia) |

---

## Arquitectura: Enfoque C — Patrón Semanal + Tabla de Overrides

```
Collection          ← contenedor narrativo (sin fechas)
  └── Program       ← unidad viva: startDate, endDate, isActive
        └── ProgramRoutine  ← routineId + recurrenceDays [MON,WED,FRI]
              └── ScheduleOverride  ← date + type (MOVED|CANCELLED|ADDED)

DailyLog            ← date, routineId, source (SCHEDULED|AD_HOC), status
  └── ExerciseLog   ← ejercicio ejecutado con métricas reales
```

El calendario **no pre-genera** eventos. Los computa al vuelo combinando patrón + overrides.

---

## Modelo de Datos (Prisma)

### Modelos eliminados
- `Phase` — absorbido por el nuevo `Program`
- `ProgramDay` — reemplazado por `ProgramRoutine`
- `ExerciseOverride` — reemplazado por `ScheduleOverride`

### Modelos renombrados/refactorizados
- `Program` → **`Collection`** (contenedor sin fechas: id, userId, name, description, isActive)
- Nueva entidad **`Program`** (antes Phase): collectionId, name, startDate, endDate, isActive, description, rpeTarget

### Modelos nuevos

**`ExerciseFamily`**
```
id          String  @id
name        String
slug        String  @unique
description String?
```

**`ProgramRoutine`**
```
id              String   @id
programId       String   → Program
routineId       String   → Routine
recurrenceDays  String[] // ["MON","WED","FRI"]
startDate       DateTime?
endDate         DateTime?
createdAt       DateTime
```

**`ScheduleOverride`**
```
id               String              @id
programRoutineId String              → ProgramRoutine
type             ScheduleOverrideType // MOVED | CANCELLED | ADDED
originalDate     DateTime?
newDate          DateTime?
routineId        String?             // para ADDED/MOVED con rutina diferente
notes            String?
createdAt        DateTime
```

### Modelos modificados

**`Exercise`** — cambios:
- Eliminar: `parentId`, relación `parent`/`variants`
- Agregar: `familyId String?`, `familyLevel Int?`, `familyRole FamilyRole?`

**`DailyLog`** — cambios:
- Agregar: `source SessionSource` (SCHEDULED | AD_HOC)
- Eliminar relación con `Phase`

### Modelos sin cambios estructurales
`Routine`, `RoutineExercise`, `ExerciseLog`, `BodyMeasurement`, `User`, `Session`

### Enums nuevos
```prisma
enum FamilyRole {
  MAIN_PATH
  VARIANT
}

enum ScheduleOverrideType {
  MOVED
  CANCELLED
  ADDED
}

enum SessionSource {
  SCHEDULED
  AD_HOC
}
```

---

## Navegación

### Bottom bar (mobile) / Sidebar (desktop)
```
Hoy        /today
Calendario /calendar
Progreso   /progress
Entrena    /training
```

### Mapa de rutas completo
```
/today
/calendar                         Vista mes (default)
/calendar/week                    Vista semana
/calendar/day/[date]              Vista día específico

/training                         Hub
/training/collections             Lista de Collections
/training/collections/[id]        Programas dentro de la collection
/training/programs/[id]           Detalle: fechas, rutinas, recurrencia
/training/routines                Catálogo de rutinas
/training/routines/[id]           Editor de rutina
/training/exercises               Catálogo de ejercicios
/training/exercises/[id]          Detalle + historial + gráfica de familia
/training/session                 Sesión activa (inmersiva)

/progress                         Dashboard: streaks, volumen, adherencia
/progress/exercise/[familyId]     Gráfica de progresión de familia
```

---

## Lógica del Calendario

`CalendarService.getRoutinesForDate(programId, date)`:
1. Obtener `ProgramRoutines` activas del programa en esa fecha
2. Para cada una: comprobar si `date.dayOfWeek ∈ recurrenceDays` → candidata
3. Aplicar `ScheduleOverrides`:
   - `CANCELLED` con `originalDate = date` → eliminar
   - `MOVED` con `originalDate = date` → eliminar
   - `ADDED` con `newDate = date` → agregar
   - `MOVED` con `newDate = date` → agregar (con routineId del override si es diferente)
4. Retornar lista final de routineIds

---

## Componentes clave

| Componente | Descripción |
|---|---|
| `CalendarMonthView` | Grid mensual, chips por rutina, indicador de completado |
| `CalendarWeekView` | 7 columnas, rutinas como bloques, soporte drag-drop para overrides |
| `TodayView` | Cards de rutinas del día + CTA sesión ad-hoc |
| `ProgramRoutineEditor` | Configurar recurrenceDays + fechas de la rutina dentro del programa |
| `ScheduleOverrideModal` | Mover / cancelar / añadir un día específico |
| `ExerciseFamilyChart` | familyLevel vs tiempo — línea limpia MAIN_PATH + puntos VARIANT |
| `AdherenceChart` | % sesiones completadas vs programadas por semana |
| `StreakCounter` | Racha actual + mejor racha |

---

## Flujo de datos

```
Prisma (PostgreSQL)
  ↓
API Routes
  /api/calendar/[date]            → CalendarService.getRoutinesForDate()
  /api/programs/[id]              → CRUD Collection / Program / ProgramRoutine
  /api/schedule-override          → CRUD ScheduleOverride
  /api/daily-log                  → crear/actualizar DailyLog + ExerciseLogs
  /api/progress/family/[familyId] → historial por ExerciseFamily
  ↓
Server Components (data fetching en página)
  ↓
Client Components (sesión en vivo, calendario interactivo)
```

---

## Flujo principal del usuario

```
Abrir app → /today
  ├── Ver rutinas del día (programa activo vía CalendarService)
  ├── Tap "Iniciar" → /training/session
  │     ├── Registrar sets, RPE, dolor, forma por ejercicio
  │     └── Finalizar → resumen post-sesión → /today
  ├── Tap en calendario → /calendar/day/[date]
  │     └── Ver planificado + historial ejecutado ese día
  └── Tap "Sesión libre" → seleccionar rutina → /training/session (source: AD_HOC)
```

---

## Sprints sugeridos

| Sprint | Foco |
|---|---|
| 1 | Reset DB + nuevo schema Prisma + seed básico |
| 2 | CalendarService + vistas /today y /calendar |
| 3 | CRUD Collection/Program/ProgramRoutine + ScheduleOverride |
| 4 | Sesión activa (/training/session) con nuevo modelo |
| 5 | ExerciseFamily + catálogo de ejercicios refactorizado |
| 6 | Progreso: ExerciseFamilyChart + AdherenceChart + streaks |
