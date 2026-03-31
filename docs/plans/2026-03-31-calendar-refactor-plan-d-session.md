# Calendar-First Refactor — Plan D: Session Execution

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.
> **Prerequisite:** Plans A (schema), B (CalendarService), and C (Programs CRUD) must be complete.

**Goal:** Refactor the active session flow (`/training/session`) to support multiple routines per day, distinguish SCHEDULED vs AD_HOC sources, register ExerciseLogs with the new model, and show a post-session summary. The session page becomes an immersive full-screen experience.

**Architecture:** The page receives `routineId` and optional `source` via search params. `useSessionState` hook manages local state. On completion, a `DailyLog` is upserted with the correct `source` and status. Multiple sessions in the same day create separate `DailyLog` records (one per routine via the unique constraint `[userId, date, routineId]`).

**Tech Stack:** Next.js 16 App Router, Prisma 7, Tailwind, shadcn/ui, TypeScript 5

---

## Scope Note

| Plan | Scope |
|---|---|
| A | Schema reset, types, seed |
| B | CalendarService + `/today` + `/calendar` views + nav |
| C | CRUD Collections / Programs / ProgramRoutines / ScheduleOverride |
| **D (this)** | Session execution refactor (`/training/session`) |
| E | ExerciseFamily + exercise catalog refactor |
| F | Progress: charts, adherence, streaks |

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `features/session/api/session-repository.ts` | Add multi-routine session methods |
| Modify | `features/session/api/prisma-session-repository.ts` | Implement multi-routine daily logs |
| Modify | `features/session/hooks/use-session-state.ts` | Accept routineId param, handle source |
| Create | `app/(app)/training/session/page.tsx` | Session page (RSC shell) |
| Create | `features/session/components/session-shell.tsx` | Client wrapper — orchestrates flow |
| Modify | `features/session/components/today-session.tsx` | Update CTAs to pass routineId + source |
| Modify | `features/session/components/focus-exercise-card.tsx` | Use new ExerciseLog fields |
| Modify | `features/session/components/post-session-form.tsx` | Post-session with new fields |
| Create | `features/session/components/session-summary.tsx` | Post-session summary card |
| Modify | `features/session/components/exercise-session-card.tsx` | Align with new model |
| Modify | `app/api/daily-log/route.ts` | Support multi-routine per day, source field |
| Modify | `app/api/exercise-log/route.ts` | Align with new ExerciseLog fields |
| Create | `features/session/types/session.types.ts` | Session-specific types |

---

## Task 1: Create session-specific types

**Files:**
- Create: `features/session/types/session.types.ts`

- [ ] **Step 1: Create types**

```typescript
// features/session/types/session.types.ts
import type { RoutineWithExercises, DailyLogWithExercises } from "@/types"

export type SessionSource = "SCHEDULED" | "AD_HOC"
export type SessionPhase = "idle" | "training" | "post-session" | "done"

export interface SessionPageParams {
  routineId: string
  source: SessionSource
  dailyLogId?: string
}

export interface SessionRoutineData {
  routine: RoutineWithExercises
  dailyLog: DailyLogWithExercises | null
  source: SessionSource
}

export interface PostSessionData {
  overallRpe?: number
  energyLevel?: number
  sleepHours?: number
  sleepQuality?: number
  mood?: number
  bodyWeight?: number
  painLevel?: number
  painNotes?: string
  notes?: string
}

export interface SessionSummary {
  routineName: string
  source: SessionSource
  exercisesCompleted: number
  exercisesTotal: number
  durationMin: number
  overallRpe: number | null
  status: string
}
```

- [ ] **Step 2: Commit**

```bash
git add features/session/types/
git commit -m "feat(session): add session-specific types"
```

---

## Task 2: Update session repository for multi-routine support

**Files:**
- Modify: `features/session/api/session-repository.ts`
- Modify: `features/session/api/prisma-session-repository.ts`

- [ ] **Step 1: Update interface** — add method signatures:

```typescript
// Add to SessionRepository interface
getOrCreateDailyLog(userId: string, routineId: string, source: SessionSource): Promise<DailyLogWithExercises>
getDailyLogForRoutine(userId: string, routineId: string): Promise<DailyLogWithExercises | null>
finishSession(dailyLogId: string, input: FinishSessionInput): Promise<DailyLog>
```

```typescript
export interface FinishSessionInput {
  status: string
  finishedAt: string
  durationMin?: number
  overallRpe?: number
  energyLevel?: number
  sleepHours?: number
  sleepQuality?: number
  mood?: number
  bodyWeight?: number
  painLevel?: number
  painNotes?: string
  notes?: string
}
```

- [ ] **Step 2: Implement in PrismaSessionRepository**

Key logic for `getOrCreateDailyLog`:
```typescript
async getOrCreateDailyLog(userId: string, routineId: string, source: SessionSource): Promise<DailyLogWithExercises> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Unique constraint: [userId, date, routineId]
  const existing = await prisma.dailyLog.findUnique({
    where: { userId_date_routineId: { userId, date: today, routineId } },
    include: {
      routine: true,
      exerciseLogs: { include: { exercise: true }, orderBy: { createdAt: "asc" } },
    },
  })

  if (existing) return existing

  return prisma.dailyLog.create({
    data: {
      userId,
      date: today,
      routineId,
      source,
      status: "PENDING",
      startedAt: new Date(),
    },
    include: {
      routine: true,
      exerciseLogs: { include: { exercise: true }, orderBy: { createdAt: "asc" } },
    },
  })
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add features/session/api/
git commit -m "feat(session): multi-routine daily log support in repository"
```

---

## Task 3: Update daily-log and exercise-log API routes

**Files:**
- Modify: `app/api/daily-log/route.ts`
- Modify: `app/api/exercise-log/route.ts`

- [ ] **Step 1: Update daily-log POST route** — accept `source` field ("SCHEDULED" | "AD_HOC"), use the unique constraint `[userId, date, routineId]` for upsert logic. Multiple daily logs per day are valid (one per routine).

- [ ] **Step 2: Update exercise-log POST route** — align with the new ExerciseLog fields from the schema: `formQuality`, `usedRegression`, `regressionNote`, `holdTimeSec`.

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/daily-log/ app/api/exercise-log/
git commit -m "feat(api): update daily-log and exercise-log routes for multi-routine sessions"
```

---

## Task 4: Create session page and shell

**Files:**
- Create: `app/(app)/training/session/page.tsx`
- Create: `features/session/components/session-shell.tsx`

- [ ] **Step 1: Create session page (RSC)**

```typescript
// app/(app)/training/session/page.tsx
import { redirect } from "next/navigation"
import { getRequiredSession } from "@/lib/get-session"
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { SessionShell } from "@/features/session/components/session-shell"
import { prisma } from "@/lib/prisma"
import type { SessionSource } from "@/features/session/types/session.types"

const sessionRepo = new PrismaSessionRepository()
const exerciseRepo = new PrismaExerciseRepository()

interface PageProps {
  searchParams: Promise<{ routineId?: string; source?: string }>
}

export default async function SessionPage({ searchParams }: PageProps) {
  const user = await getRequiredSession()
  const { routineId, source: sourceParam } = await searchParams

  if (!routineId) redirect("/today")

  const source: SessionSource = sourceParam === "AD_HOC" ? "AD_HOC" : "SCHEDULED"

  const [routine, dailyLog, allExercises] = await Promise.all([
    prisma.routine.findUnique({
      where: { id: routineId },
      include: {
        exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
      },
    }),
    sessionRepo.getDailyLogForRoutine(user.id, routineId),
    exerciseRepo.findAll(),
  ])

  if (!routine) redirect("/today")

  return (
    <SessionShell
      routine={routine}
      dailyLog={dailyLog}
      source={source}
      allExercises={allExercises}
    />
  )
}
```

- [ ] **Step 2: Create SessionShell** — client component that wraps `useSessionState` and orchestrates the four phases: idle → training → post-session → done. Renders:
  - **idle**: Routine overview + "Start" button
  - **training**: Exercise-by-exercise focus view (existing `FocusExerciseCard`)
  - **post-session**: `PostSessionForm`
  - **done**: `SessionSummary` + "Back to Today" link

```tsx
// features/session/components/session-shell.tsx
"use client"

import type { RoutineWithExercises, DailyLogWithExercises, Exercise } from "@/types"
import type { SessionSource } from "../types/session.types"
import { useSessionState } from "../hooks/use-session-state"
// ... import sub-components

interface SessionShellProps {
  routine: RoutineWithExercises
  dailyLog: DailyLogWithExercises | null
  source: SessionSource
  allExercises: Exercise[]
}

export function SessionShell({ routine, dailyLog, source, allExercises }: SessionShellProps) {
  const session = useSessionState({ routine, dailyLog })

  // Render based on session.sessionPhase
  // idle → overview, training → focus view, post-session → form, done → summary
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/(app)/training/session/ features/session/components/session-shell.tsx
git commit -m "feat(session): create session page and orchestration shell"
```

---

## Task 5: Update useSessionState hook

**Files:**
- Modify: `features/session/hooks/use-session-state.ts`

- [ ] **Step 1: Update hook params** — accept `source: SessionSource` in params. Pass `source` when creating daily logs via `ensureDailyLog`.

- [ ] **Step 2: Update ensureDailyLog** — send `source` field in the POST body. Use the new `getOrCreateDailyLog` endpoint pattern.

- [ ] **Step 3: Update handleFinishSession** — pass `source` to the finish endpoint.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add features/session/hooks/
git commit -m "feat(session): update useSessionState for multi-routine + source support"
```

---

## Task 6: Update TodaySession to link sessions correctly

**Files:**
- Modify: `features/session/components/today-session.tsx`

- [ ] **Step 1: Update CTA links** — each routine card should link to:
```
/training/session?routineId={entry.routineId}&source=SCHEDULED
```

The "free session" button should link to:
```
/training/session?routineId={selectedRoutineId}&source=AD_HOC
```

- [ ] **Step 2: Show per-routine completion status** — match `dailyLogs` entries with `entries` by routineId. Show "Completada" badge on completed routine cards.

- [ ] **Step 3: Verify compilation and test**

```bash
npx tsc --noEmit
```

Open /today, tap "Iniciar sesión" on a routine card, verify session page loads with correct routine.

- [ ] **Step 4: Commit**

```bash
git add features/session/components/today-session.tsx
git commit -m "feat(today): update session links with routineId and source params"
```

---

## Task 7: Build SessionSummary component

**Files:**
- Create: `features/session/components/session-summary.tsx`

- [ ] **Step 1: Create SessionSummary** — shows after session completion:
  - Routine name
  - Source badge (Programada / Libre)
  - Exercises completed / total
  - Duration
  - RPE
  - Status (Completada / Parcial)
  - "Volver a Hoy" link

```tsx
// features/session/components/session-summary.tsx
"use client"

import Link from "next/link"
import { CheckCircle, Clock, Activity } from "lucide-react"
import type { SessionSummary as SummaryData } from "../types/session.types"

interface SessionSummaryProps {
  summary: SummaryData
}

export function SessionSummary({ summary }: SessionSummaryProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <CheckCircle className="h-16 w-16 text-emerald-400" />
      <h1 className="text-xl font-semibold">¡Sesión terminada!</h1>

      <div className="w-full max-w-sm space-y-3">
        <div className="rounded-xl bg-zinc-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{summary.routineName}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              summary.source === "SCHEDULED"
                ? "bg-blue-900/40 text-blue-300"
                : "bg-amber-900/40 text-amber-300"
            }`}>
              {summary.source === "SCHEDULED" ? "Programada" : "Libre"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-zinc-700 rounded-lg p-2">
              <p className="text-zinc-400">Ejercicios</p>
              <p className="font-medium">{summary.exercisesCompleted}/{summary.exercisesTotal}</p>
            </div>
            <div className="bg-zinc-700 rounded-lg p-2">
              <p className="text-zinc-400">Duración</p>
              <p className="font-medium">{summary.durationMin}min</p>
            </div>
            {summary.overallRpe && (
              <div className="bg-zinc-700 rounded-lg p-2">
                <p className="text-zinc-400">RPE</p>
                <p className="font-medium">{summary.overallRpe}/10</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Link
        href="/today"
        className="bg-zinc-700 hover:bg-zinc-600 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
      >
        Volver a Hoy
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/session/components/session-summary.tsx
git commit -m "feat(session): add post-session summary component"
```

---

## Task 8: Update exercise logging components

**Files:**
- Modify: `features/session/components/focus-exercise-card.tsx`
- Modify: `features/session/components/exercise-session-card.tsx`

- [ ] **Step 1: Add formQuality selector** — dropdown with PERFECT/GOOD/FAIR/POOR options passed alongside the exercise log.

- [ ] **Step 2: Add usedRegression toggle** — checkbox "Usé regresión" + optional text field for `regressionNote`.

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add features/session/components/focus-exercise-card.tsx features/session/components/exercise-session-card.tsx
git commit -m "feat(session): add formQuality and regression fields to exercise cards"
```

---

## Task 9: Integration test

- [ ] **Step 1: Start dev server and test full flow**

1. Open `/today` — verify routine cards appear
2. Tap "Iniciar sesión" on a routine → verify `/training/session?routineId=...&source=SCHEDULED`
3. Complete exercises one by one
4. Fill post-session form → submit
5. Verify summary screen shows
6. Navigate to `/today` — verify routine shows as "Completada"
7. Navigate to `/calendar/day/[today]` — verify DailyLog shows completed
8. Test "Sesión libre" flow with source=AD_HOC

- [ ] **Step 2: Verify database state**

```bash
npx prisma studio
```

Check `daily_log` table: should have entries with correct `source`, `status`, `routineId`. Check `exercise_log`: correct fields populated.

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "feat(session): complete session execution refactor — multi-routine + source support"
```

---

## Plan D Complete

The session execution flow now supports multiple routines per day via separate DailyLog records, distinguishes SCHEDULED from AD_HOC sessions, captures formQuality and regression data on ExerciseLogs, and provides a clean post-session summary. The /today page correctly links to each routine's session.

**Next: Plan E** — ExerciseFamily as a visible entity, refactored exercise catalog with family grouping and familyLevel selector.
