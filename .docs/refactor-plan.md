# Plan de Refactoring: Estructura, SOLID y Next.js Best Practices

> Fecha de análisis: 2026-03-25
> Stack: Next.js 16 + Prisma 7 + Tailwind 4 + shadcn/ui
> Objetivo: Reorganizar el proyecto siguiendo feature-based architecture, SOLID principles y Next.js App Router best practices, **sin romper funcionalidad existente**.

---

## 0. Diagnóstico del estado actual

### Problemas detectados

| Categoría | Problema | Archivo(s) afectado(s) | Principio violado |
|---|---|---|---|
| Estructura | Componentes organizados por tipo, no por feature | `components/` | Feature-based |
| Estructura | `prisma.ts` en `src/lib/` mientras todo lo demás está en raíz | `src/lib/prisma.ts` | Coherencia de paths |
| Estructura | No existe capa `features/` — UI, lógica y tipos mezclados | Global | Feature isolation |
| SOLID | `today-session.tsx` tiene 570 líneas, maneja estado, UI, API calls y lógica de sesión | `components/today/today-session.tsx` | SRP |
| SOLID | `lib/training.ts` tiene 340 líneas con responsabilidades de repositorio, agregación y presentación | `lib/training.ts` | SRP, DIP |
| SOLID | API routes instancian Prisma directamente via `lib/` (acoplamiento a implementación concreta) | `app/api/**/*.ts` | DIP |
| SOLID | Sin interfaces/abstracciones para los repositorios — nada puede substituirse | `lib/exercises.ts`, `lib/daily-log.ts` | DIP, LSP |
| SOLID | `ExerciseLog` session card mezcla UI y lógica de validación de sets | `components/today/exercise-session-card.tsx` | SRP |
| Next.js | Sin directivas `use cache` en data fetching de Server Components | `lib/*.ts`, páginas | Caching |
| Next.js | Sin validación Zod en API routes — inputs de usuario sin validar | `app/api/**/*.ts` | Boundary validation |
| Next.js | Sin esquemas de validación — TanStack Form + Zod no implementados | Forms | Type safety |
| Next.js | `today-session.tsx` completo como Client Component aunque partes podrían ser Server | `components/today/` | RSC boundary |

---

## 1. Nueva estructura de carpetas objetivo

```
workout/
├── app/                          # Next.js App Router — SOLO routing
│   ├── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # ← Thin: importa de features/dashboard
│   │   ├── today/page.tsx        # ← Thin: importa de features/session
│   │   ├── training/page.tsx     # ← Thin: importa de features/training
│   │   └── exercises/
│   │       ├── page.tsx          # ← Thin: importa de features/exercises
│   │       └── [id]/page.tsx     # ← Thin: importa de features/exercises
│   └── api/
│       ├── exercises/route.ts        # ← Delega a features/exercises/api/
│       ├── daily-log/route.ts        # ← Delega a features/session/api/
│       ├── exercise-log/route.ts     # ← Delega a features/session/api/
│       └── training/route.ts         # ← Delega a features/training/api/
│
├── features/                     # NUEVO — módulos por dominio
│   ├── exercises/
│   │   ├── api/                  # Server-side data access (repository pattern)
│   │   │   ├── exercise-repository.ts       # Interface (puerto)
│   │   │   ├── prisma-exercise-repository.ts # Implementación Prisma
│   │   │   └── route-handlers.ts            # Lógica de route handlers
│   │   ├── components/
│   │   │   ├── exercise-card.tsx
│   │   │   ├── exercise-filters.tsx
│   │   │   ├── exercise-form.tsx
│   │   │   ├── exercise-actions.tsx
│   │   │   └── exercise-detail-actions.tsx
│   │   ├── hooks/
│   │   │   └── use-exercises.ts   # Client-side fetch hooks
│   │   ├── schemas/
│   │   │   └── exercise.schema.ts # Zod schemas para validación
│   │   └── types/
│   │       └── exercise.types.ts  # Tipos específicos del feature
│   │
│   ├── session/                  # "Today" session tracking
│   │   ├── api/
│   │   │   ├── session-repository.ts
│   │   │   ├── prisma-session-repository.ts
│   │   │   └── route-handlers.ts
│   │   ├── components/
│   │   │   ├── today-session.tsx            # Orquestador (reducido)
│   │   │   ├── session-header.tsx           # EXTRAÍDO de today-session
│   │   │   ├── session-exercise-list.tsx    # EXTRAÍDO de today-session
│   │   │   ├── exercise-session-card.tsx
│   │   │   ├── set-row.tsx                  # EXTRAÍDO de exercise-session-card
│   │   │   ├── exercise-picker.tsx
│   │   │   ├── rest-timer.tsx
│   │   │   └── post-session-form.tsx
│   │   ├── hooks/
│   │   │   ├── use-session-state.ts         # EXTRAÍDO de today-session
│   │   │   └── use-rest-timer.ts            # EXTRAÍDO de rest-timer
│   │   ├── schemas/
│   │   │   └── session.schema.ts
│   │   └── types/
│   │       └── session.types.ts
│   │
│   ├── training/                 # Training dashboard (week/month/year)
│   │   ├── api/
│   │   │   ├── training-repository.ts
│   │   │   ├── prisma-training-repository.ts
│   │   │   └── route-handlers.ts
│   │   ├── components/
│   │   │   ├── training-dashboard.tsx
│   │   │   ├── week-view.tsx
│   │   │   ├── month-view.tsx
│   │   │   ├── year-view.tsx
│   │   │   └── day-cell.tsx
│   │   ├── hooks/
│   │   │   └── use-training-data.ts
│   │   ├── utils/
│   │   │   └── training-grid.ts  # MOVIDO desde lib/training-utils.ts
│   │   └── types/
│   │       └── training.types.ts # MOVIDO desde types/training.ts
│   │
│   └── dashboard/
│       └── components/
│           └── dashboard-stats.tsx
│
├── components/                   # Shared UI — solo componentes usados en 2+ features
│   ├── ui/                       # shadcn/ui (sin cambios)
│   └── layout/
│       ├── sidebar.tsx
│       ├── sidebar-nav-links.tsx
│       └── mobile-header.tsx
│
├── lib/                          # Infraestructura compartida
│   ├── prisma.ts                 # MOVIDO desde src/lib/prisma.ts
│   ├── utils.ts
│   └── navigation.ts
│
├── types/                        # Solo tipos verdaderamente globales/compartidos
│   └── index.ts                  # Re-exports de Prisma + interfaces cross-feature
│
└── config/                       # NUEVO — configuración centralizada
    └── app.config.ts             # Constantes, feature flags
```

---

## 2. Plan de ejecución por fases

---

### FASE 1 — Consolidar infraestructura base
**Impacto:** Bajo riesgo, sin cambios de comportamiento
**Duración estimada:** 1 sesión

#### 1.1 Mover `prisma.ts` a raíz
```
src/lib/prisma.ts → lib/prisma.ts
```
- Actualizar todos los imports que apunten a `@/src/lib/prisma`
- Archivos afectados: `lib/exercises.ts`, `lib/daily-log.ts`, `lib/training.ts`, todos los API routes

#### 1.2 Crear `config/app.config.ts`
```typescript
// config/app.config.ts
export const APP_CONFIG = {
  defaultRestSeconds: 90,
  rpeScale: { min: 1, max: 10 },
  sessionPhases: ['warmup', 'main', 'cooldown'] as const,
} as const;
```

#### 1.3 Unificar el path alias en `tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```
Verificar que todos los imports usen `@/` consistentemente.

---

### FASE 2 — Introducir Repository Pattern (DIP)
**Impacto:** Medio — refactor interno de `lib/`, sin tocar componentes
**Principios:** DIP, OCP, LSP

#### 2.1 Crear interfaces de repositorio

```typescript
// features/exercises/api/exercise-repository.ts
export interface ExerciseRepository {
  findMany(filters: ExerciseFilters): Promise<ExerciseCardData[]>;
  findById(id: string): Promise<ExerciseWithDetails | null>;
  count(): Promise<number>;
  create(data: CreateExerciseInput): Promise<Exercise>;
  update(id: string, data: UpdateExerciseInput): Promise<Exercise>;
  delete(id: string): Promise<void>;
}
```

```typescript
// features/session/api/session-repository.ts
export interface SessionRepository {
  getTodayRoutine(): Promise<RoutineWithExercises | null>;
  getTodayLog(): Promise<DailyLogWithExercises | null>;
  createDailyLog(data: CreateDailyLogInput): Promise<DailyLog>;
  updateDailyLog(id: string, data: UpdateDailyLogInput): Promise<DailyLog>;
  logExercise(data: CreateExerciseLogInput): Promise<ExerciseLog>;
}
```

```typescript
// features/training/api/training-repository.ts
export interface TrainingRepository {
  getWeekData(date: Date): Promise<WeekData>;
  getMonthData(year: number, month: number): Promise<MonthData>;
  getYearData(year: number): Promise<YearData>;
}
```

#### 2.2 Implementaciones Prisma

```typescript
// features/exercises/api/prisma-exercise-repository.ts
import { prisma } from '@/lib/prisma';
import type { ExerciseRepository } from './exercise-repository';

export class PrismaExerciseRepository implements ExerciseRepository {
  async findMany(filters: ExerciseFilters): Promise<ExerciseCardData[]> {
    // Mover lógica desde lib/exercises.ts getExercises()
  }
  // ... resto de métodos
}
```

#### 2.3 Migrar lógica existente

| Origen | Destino | Notas |
|---|---|---|
| `lib/exercises.ts` → funciones | `features/exercises/api/prisma-exercise-repository.ts` | Implementa interface |
| `lib/daily-log.ts` → funciones | `features/session/api/prisma-session-repository.ts` | Implementa interface |
| `lib/training.ts` → DB queries | `features/training/api/prisma-training-repository.ts` | Separar queries de transformación |
| `lib/training.ts` → transformaciones | `features/training/utils/training-grid.ts` | Funciones puras |
| `lib/training-utils.ts` | `features/training/utils/training-grid.ts` | Merge con anterior |

#### 2.4 Actualizar API routes para usar repositorios

```typescript
// app/api/exercises/route.ts — ANTES
import { getExercises } from '@/lib/exercises';

// app/api/exercises/route.ts — DESPUÉS
import { PrismaExerciseRepository } from '@/features/exercises/api/prisma-exercise-repository';
const repo = new PrismaExerciseRepository();
```

---

### FASE 3 — Validación con Zod en API routes
**Impacto:** Mejora de seguridad y type safety
**Principios:** Boundary validation (Next.js best practice)

#### 3.1 Crear schemas Zod por feature

```typescript
// features/exercises/schemas/exercise.schema.ts
import { z } from 'zod';
import { MuscleGroup, MovementType } from '@prisma/client';

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.nativeEnum(MuscleGroup),
  movementType: z.nativeEnum(MovementType),
  sets: z.number().int().min(1).max(10).optional(),
  reps: z.number().int().min(1).max(50).optional(),
});

export const exerciseFiltersSchema = z.object({
  muscleGroup: z.nativeEnum(MuscleGroup).optional(),
  search: z.string().max(50).optional(),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
```

```typescript
// features/session/schemas/session.schema.ts
export const logExerciseSchema = z.object({
  dailyLogId: z.string().cuid(),
  exerciseId: z.string().cuid(),
  repsPerSet: z.array(z.number().int().min(0).max(100)),
  rpeActual: z.number().min(1).max(10).optional(),
  formQuality: z.nativeEnum(FormQuality).optional(),
  painDuring: z.number().min(0).max(10).optional(),
});
```

#### 3.2 Aplicar validación en route handlers

```typescript
// app/api/exercises/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createExerciseSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exercise = await repo.create(parsed.data);
  return Response.json(exercise, { status: 201 });
}
```

---

### FASE 4 — Descomponer `today-session.tsx` (SRP)
**Impacto:** El cambio más crítico — componente de 570 líneas
**Principios:** SRP, RSC boundaries

#### 4.1 Extraer custom hooks

```typescript
// features/session/hooks/use-session-state.ts
// Responsabilidad: Estado de la sesión (exercises, phase, dailyLogId)
export function useSessionState(initialData: TodayResponse) {
  const [exercises, setExercises] = useState(/* ... */);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('idle');
  const [dailyLogId, setDailyLogId] = useState<string | null>(null);

  const startSession = useCallback(async () => { /* ... */ }, []);
  const completeExercise = useCallback((id: string) => { /* ... */ }, []);
  const finishSession = useCallback(async () => { /* ... */ }, []);

  return { exercises, sessionPhase, dailyLogId, startSession, completeExercise, finishSession };
}
```

```typescript
// features/session/hooks/use-rest-timer.ts
// Responsabilidad: Temporizador de descanso
export function useRestTimer(defaultSeconds: number) {
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);

  // Lógica del timer extraída de rest-timer.tsx y today-session.tsx
  return { isRunning, secondsLeft, start, stop, reset };
}
```

#### 4.2 Extraer subcomponentes

| Componente nuevo | Responsabilidad | Extraído de |
|---|---|---|
| `session-header.tsx` | Muestra fase actual, RPE objetivo, botones de inicio/fin | `today-session.tsx` líneas ~1-80 |
| `session-exercise-list.tsx` | Renderiza la lista de ejercicios del día | `today-session.tsx` líneas ~150-300 |
| `set-row.tsx` | Una fila de set con input de reps, RPE, dolor | `exercise-session-card.tsx` |
| `free-session-controls.tsx` | Botones para agregar ejercicios en sesión libre | `today-session.tsx` |

#### 4.3 `today-session.tsx` resultado final

```typescript
// features/session/components/today-session.tsx — ~80 líneas
'use client';
export function TodaySession({ initialData }: { initialData: TodayResponse }) {
  const sessionState = useSessionState(initialData);
  const restTimer = useRestTimer(APP_CONFIG.defaultRestSeconds);

  return (
    <div>
      <SessionHeader phase={sessionState.sessionPhase} onStart={sessionState.startSession} />
      <SessionExerciseList
        exercises={sessionState.exercises}
        onComplete={sessionState.completeExercise}
        onSetDone={restTimer.start}
      />
      {restTimer.isRunning && <RestTimer {...restTimer} />}
      {sessionState.sessionPhase === 'post' && (
        <PostSessionForm dailyLogId={sessionState.dailyLogId} />
      )}
    </div>
  );
}
```

---

### FASE 5 — Mover componentes a features/
**Impacto:** Solo reorganización de archivos + actualizar imports
**Orden:** después de Fase 4 para no mover código que aún se va a refactorizar

#### Mapeo de movimientos

```
components/exercises/exercise-card.tsx       → features/exercises/components/
components/exercises/exercise-filters.tsx    → features/exercises/components/
components/exercises/exercise-form.tsx       → features/exercises/components/
components/exercises/exercise-actions.tsx    → features/exercises/components/
components/exercises/exercise-detail-actions.tsx → features/exercises/components/

components/today/today-session.tsx           → features/session/components/
components/today/exercise-session-card.tsx   → features/session/components/
components/today/exercise-picker.tsx         → features/session/components/
components/today/rest-timer.tsx              → features/session/components/
components/today/post-session-form.tsx       → features/session/components/

components/training/training-dashboard.tsx  → features/training/components/
components/training/week-view.tsx           → features/training/components/
components/training/month-view.tsx          → features/training/components/
components/training/year-view.tsx           → features/training/components/
components/training/day-cell.tsx            → features/training/components/

types/training.ts                           → features/training/types/training.types.ts
```

#### Componentes que se quedan en `components/` (shared)
```
components/ui/         → sin cambios (shadcn)
components/layout/     → sin cambios (usado en app shell, cross-feature)
```

---

### FASE 6 — Optimización RSC y caching
**Impacto:** Performance — sin cambios de comportamiento
**Principios:** Next.js Server Components first

#### 6.1 Identificar límites RSC

| Componente | Estado actual | Estado objetivo | Razón |
|---|---|---|---|
| `app/(app)/exercises/page.tsx` | Server ✓ | Server ✓ | Correcto |
| `app/(app)/exercises/[id]/page.tsx` | Server ✓ | Server ✓ | Correcto |
| `app/(app)/training/page.tsx` | Server ✓ | Server ✓ | Correcto |
| `features/exercises/components/exercise-filters.tsx` | Client ✓ | Client ✓ | Necesita interacción |
| `features/session/components/today-session.tsx` | Client ✓ | Client ✓ | Estado de sesión |
| `features/session/components/session-header.tsx` | (nuevo) | Server | Sin estado — solo props |
| `features/training/components/training-dashboard.tsx` | Client ✓ | Client ✓ | Switcher de vistas |
| `features/training/components/week-view.tsx` | Client | Server (recibe data) | Sin interacción |

#### 6.2 Agregar directiva `use cache`

```typescript
// features/exercises/api/prisma-exercise-repository.ts
import { unstable_cache } from 'next/cache';

export class PrismaExerciseRepository implements ExerciseRepository {
  findMany = unstable_cache(
    async (filters: ExerciseFilters) => {
      return prisma.exercise.findMany({ /* ... */ });
    },
    ['exercises-list'],
    { revalidate: 3600, tags: ['exercises'] }
  );
}
```

#### 6.3 Páginas thin — patrón

```typescript
// app/(app)/exercises/page.tsx — DESPUÉS (thin page)
import { PrismaExerciseRepository } from '@/features/exercises/api/prisma-exercise-repository';
import { ExerciseCatalog } from '@/features/exercises/components/exercise-catalog';

const repo = new PrismaExerciseRepository();

export default async function ExercisesPage() {
  const exercises = await repo.findMany({});
  const count = await repo.count();
  return <ExerciseCatalog exercises={exercises} total={count} />;
}
```

---

### FASE 7 — Tipos consolidados
**Impacto:** Solo reorganización

#### 7.1 Principio de organización de tipos

| Tipo | Ubicación | Criterio |
|---|---|---|
| Tipos Prisma re-exportados | `types/index.ts` | Cross-feature |
| Interfaces cross-feature | `types/index.ts` | Usadas en 2+ features |
| Tipos de un solo feature | `features/[name]/types/` | Solo usados internamente |
| Zod schemas (fuente de verdad) | `features/[name]/schemas/` | Generan tipos via `z.infer` |

#### 7.2 Eliminar duplicación

Actualmente `types/exercise.ts` y parte de `types/index.ts` definen tipos de ejercicio que también existen en `features/exercises`. Consolidar en `features/exercises/types/exercise.types.ts` y re-exportar en `types/index.ts` solo lo cross-feature.

---

## 3. Orden de ejecución recomendado

```
FASE 1 → FASE 2 → FASE 3 → FASE 4 → FASE 5 → FASE 6 → FASE 7
  │         │         │         │         │         │         │
Bajo      Medio     Bajo      Alto      Bajo      Bajo      Bajo
riesgo    riesgo    riesgo    riesgo    riesgo    riesgo    riesgo
```

**Por qué este orden:**
- Fase 1 antes que todo — paths consistentes evitan doble trabajo
- Fase 2 antes que Fase 5 — mover archivos antes de refactorizar es más seguro
- Fase 4 antes que Fase 5 — descomponer `today-session` antes de moverlo
- Fase 6 al final — optimizar solo cuando la estructura es estable

---

## 4. Checklist de validación por fase

### Fase 1
- [ ] `src/lib/prisma.ts` eliminado, `lib/prisma.ts` creado
- [ ] Cero imports a `@/src/lib/prisma` en el codebase
- [ ] `next dev` sin errores

### Fase 2
- [ ] Interfaces de repositorio creadas (3 archivos)
- [ ] Implementaciones Prisma creadas (3 archivos)
- [ ] API routes usan repositorios, no `lib/` directamente
- [ ] Funciones en `lib/exercises.ts`, `lib/daily-log.ts`, `lib/training.ts` pueden eliminarse
- [ ] `next build` sin errores de TypeScript

### Fase 3
- [ ] Schemas Zod creados para todos los endpoints POST/PUT
- [ ] Todos los POST/PUT routes retornan 400 con mensaje descriptivo si el body es inválido
- [ ] Sin `as any` en route handlers

### Fase 4
- [ ] `today-session.tsx` < 120 líneas
- [ ] `use-session-state.ts` contiene todo el estado de sesión
- [ ] `exercise-session-card.tsx` < 100 líneas
- [ ] `set-row.tsx` creado y funcional
- [ ] Funcionalidad de la sesión: inicio, registro de sets, timer de descanso, post-sesión — todo intacto

### Fase 5
- [ ] `components/exercises/`, `components/today/`, `components/training/` eliminados
- [ ] Equivalentes creados en `features/*/components/`
- [ ] Todos los imports de páginas actualizados
- [ ] `next build` sin errores

### Fase 6
- [ ] Páginas en `app/` son thin (< 30 líneas de lógica)
- [ ] Al menos `findMany` de exercises tiene cache
- [ ] Componentes server donde sea posible (sin `'use client'` innecesario)

### Fase 7
- [ ] Sin tipos duplicados entre `types/` y `features/*/types/`
- [ ] `types/index.ts` solo re-exporta tipos cross-feature
- [ ] TypeScript strict — cero errores

---

## 5. Anti-patterns a evitar (recordatorio)

- **No** crear barrel files (`index.ts` que re-exporta todo) — rompe tree-shaking
- **No** importar entre features — si dos features necesitan el mismo componente, moverlo a `components/`
- **No** poner en `components/` código que solo usa un feature
- **No** agregar `'use client'` por defecto — solo cuando sea necesario (event handlers, hooks, browser APIs)
- **No** hacer fetch en Client Components si puede hacerse en Server Component padre
- **No** instanciar `PrismaClient` fuera de `lib/prisma.ts`

---

## 6. Archivos a eliminar al completar el refactor

```
src/lib/prisma.ts              (reemplazado por lib/prisma.ts)
lib/exercises.ts               (reemplazado por features/exercises/api/)
lib/daily-log.ts               (reemplazado por features/session/api/)
lib/training.ts                (reemplazado por features/training/api/ + utils/)
lib/training-utils.ts          (fusionado en features/training/utils/)
lib/navigation.ts              (mover a lib/ o eliminar si solo tiene constantes)
components/exercises/          (movido a features/exercises/components/)
components/today/              (movido a features/session/components/)
components/training/           (movido a features/training/components/)
types/exercise.ts              (consolidado en features/exercises/types/)
types/training.ts              (consolidado en features/training/types/)
```

---

## 7. Dependencias nuevas necesarias

```bash
# Zod para validación de schemas (Fase 3)
npm install zod
```

Ninguna otra dependencia nueva es necesaria para el resto del refactor.
