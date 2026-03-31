# Calendar-First Refactor — Plan B: Calendar Infrastructure

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.
> **Prerequisite:** Plan A must be complete (schema, types, seed).

**Goal:** Implement CalendarService (the core scheduling algorithm), wire it into `/today`, and build the three calendar views (`/calendar`, `/calendar/week`, `/calendar/day/[date]`). Update bottom navigation.

**Architecture:** A pure function `getRoutinesForDate()` in `lib/calendar-service.ts` computes scheduled routines by combining ProgramRoutine recurrence patterns with ScheduleOverrides. Server Components fetch via a single API route. Calendar views are RSC pages with thin client-side interactive shells.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Tailwind, shadcn/ui, TypeScript 5

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `lib/calendar-service.ts` | Pure scheduling algorithm |
| Create | `app/api/calendar/[date]/route.ts` | API: routines for a specific date |
| Create | `app/api/calendar/range/route.ts` | API: routines for a date range (week/month) |
| Modify | `features/session/api/prisma-session-repository.ts` | Wire CalendarService into getTodayData |
| Modify | `app/(app)/today/page.tsx` | Multi-routine today view |
| Modify | `features/session/components/today-session.tsx` | Render multiple routine cards |
| Create | `app/(app)/calendar/page.tsx` | Month view page |
| Create | `app/(app)/calendar/week/page.tsx` | Week view page |
| Create | `app/(app)/calendar/day/[date]/page.tsx` | Day detail page |
| Create | `features/calendar/types/calendar.types.ts` | Shared calendar types |
| Create | `features/calendar/components/calendar-month-view.tsx` | Month grid |
| Create | `features/calendar/components/calendar-week-view.tsx` | 7-column week |
| Create | `features/calendar/components/calendar-day-view.tsx` | Day detail |
| Create | `features/calendar/components/routine-chip.tsx` | Colored routine label |
| Modify | `components/layout/bottom-nav.tsx` | Add /calendar tab |
| Modify | `features/training/api/prisma-training-repository.ts` | Use CalendarService for scheduled routines |

---

## Task 1: Implement CalendarService

**Files:**
- Create: `lib/calendar-service.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/calendar-service.ts

export type DayAbbr = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

export type OverrideSource = "PATTERN" | "OVERRIDE_ADDED" | "OVERRIDE_MOVED"

export interface ScheduledRoutineEntry {
  routineId: string
  programRoutineId: string
  source: OverrideSource
}

// Input shape expected from Prisma (matches ProgramRoutineWithDetails)
export interface ProgramRoutineInput {
  id: string
  routineId: string
  recurrenceDays: string[]
  startDate: Date | null
  endDate: Date | null
  overrides: Array<{
    type: "MOVED" | "CANCELLED" | "ADDED"
    originalDate: Date | null
    newDate: Date | null
    routineId: string | null
  }>
}

const JS_DAY_TO_ABBR: DayAbbr[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Compute which routines are scheduled on `date` for the given ProgramRoutines.
 * Pure function — no DB calls.
 */
export function getRoutinesForDate(
  programRoutines: ProgramRoutineInput[],
  date: Date
): ScheduledRoutineEntry[] {
  const dateStr = toDateString(date)
  const dayAbbr = JS_DAY_TO_ABBR[date.getDay()]
  const result: ScheduledRoutineEntry[] = []

  for (const pr of programRoutines) {
    // Skip if date is outside this ProgramRoutine's active range
    if (pr.startDate) {
      const start = new Date(pr.startDate)
      start.setHours(0, 0, 0, 0)
      if (date < start) continue
    }
    if (pr.endDate) {
      const end = new Date(pr.endDate)
      end.setHours(23, 59, 59, 999)
      if (date > end) continue
    }

    const inPattern = pr.recurrenceDays.includes(dayAbbr)

    const cancelledToday = pr.overrides.some(
      (o) =>
        o.type === "CANCELLED" &&
        o.originalDate &&
        toDateString(o.originalDate) === dateStr
    )

    const movedAwayToday = pr.overrides.some(
      (o) =>
        o.type === "MOVED" &&
        o.originalDate &&
        toDateString(o.originalDate) === dateStr
    )

    const arrivingToday = pr.overrides.filter(
      (o) =>
        (o.type === "ADDED" || o.type === "MOVED") &&
        o.newDate &&
        toDateString(o.newDate) === dateStr
    )

    if (inPattern && !cancelledToday && !movedAwayToday) {
      result.push({
        routineId: pr.routineId,
        programRoutineId: pr.id,
        source: "PATTERN",
      })
    }

    for (const override of arrivingToday) {
      result.push({
        routineId: override.routineId ?? pr.routineId,
        programRoutineId: pr.id,
        source: override.type === "MOVED" ? "OVERRIDE_MOVED" : "OVERRIDE_ADDED",
      })
    }
  }

  return result
}

/**
 * Fetch the active Program for a user and return its ProgramRoutines with overrides.
 * Used by server-side callers.
 */
export async function getActiveProgramRoutines(
  userId: string,
  prisma: { collection: { findFirst: Function } }
): Promise<ProgramRoutineInput[]> {
  const collection = await (prisma.collection as any).findFirst({
    where: { userId, isActive: true },
    include: {
      programs: {
        where: { isActive: true },
        take: 1,
        include: {
          programRoutines: {
            include: { overrides: true },
          },
        },
      },
    },
  })

  return collection?.programs[0]?.programRoutines ?? []
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `lib/calendar-service.ts`.

- [ ] **Step 3: Manually verify the logic with a quick inline test**

Create a temporary file `scripts/test-calendar.ts`, run it, then delete it:

```typescript
// scripts/test-calendar.ts
import { getRoutinesForDate } from "../lib/calendar-service"

const programRoutines = [
  {
    id: "pr-1",
    routineId: "routine-fullbody",
    recurrenceDays: ["MON", "WED", "FRI"],
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-05-12"),
    overrides: [],
  },
  {
    id: "pr-2",
    routineId: "routine-mobility",
    recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    startDate: null,
    endDate: null,
    overrides: [
      {
        type: "CANCELLED" as const,
        originalDate: new Date("2026-04-07"), // Tuesday
        newDate: null,
        routineId: null,
      },
    ],
  },
]

// Monday 2026-04-06 → Full Body + Mobility
const monday = new Date("2026-04-06")
const mondayResult = getRoutinesForDate(programRoutines, monday)
console.assert(mondayResult.length === 2, `Expected 2 on Monday, got ${mondayResult.length}`)

// Tuesday 2026-04-07 → only Mobility is cancelled → 0
const tuesday = new Date("2026-04-07")
const tuesdayResult = getRoutinesForDate(programRoutines, tuesday)
console.assert(tuesdayResult.length === 0, `Expected 0 on cancelled Tuesday, got ${tuesdayResult.length}`)

// Wednesday 2026-04-08 → Full Body + Mobility
const wednesday = new Date("2026-04-08")
const wednesdayResult = getRoutinesForDate(programRoutines, wednesday)
console.assert(wednesdayResult.length === 2, `Expected 2 on Wednesday, got ${wednesdayResult.length}`)

// Thursday → only Mobility
const thursday = new Date("2026-04-09")
const thursdayResult = getRoutinesForDate(programRoutines, thursday)
console.assert(thursdayResult.length === 1, `Expected 1 on Thursday, got ${thursdayResult.length}`)
console.assert(thursdayResult[0].routineId === "routine-mobility", "Wrong routine on Thursday")

console.log("✓ All CalendarService assertions passed")
```

```bash
DATABASE_URL="postgresql://workout:workout@localhost:5432/workout_dev" \
  npx tsx scripts/test-calendar.ts
```

Expected: `✓ All CalendarService assertions passed`

Delete the temp file:
```bash
rm scripts/test-calendar.ts
```

- [ ] **Step 4: Commit CalendarService**

```bash
git add lib/calendar-service.ts
git commit -m "feat(calendar): implement CalendarService scheduling algorithm"
```

---

## Task 2: Create calendar API routes

**Files:**
- Create: `app/api/calendar/[date]/route.ts`
- Create: `app/api/calendar/range/route.ts`

- [ ] **Step 1: Create single-date route**

```typescript
// app/api/calendar/[date]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import {
  getActiveProgramRoutines,
  getRoutinesForDate,
  toDateString,
} from "@/lib/calendar-service"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const { date: dateParam } = await params
    const date = new Date(dateParam + "T00:00:00")
    if (isNaN(date.getTime())) return apiError("Invalid date format. Use YYYY-MM-DD", 400)

    const programRoutines = await getActiveProgramRoutines(user.id, prisma)
    const entries = getRoutinesForDate(programRoutines, date)

    if (entries.length === 0) {
      return NextResponse.json({ date: toDateString(date), entries: [], routines: [] })
    }

    // Fetch full routine details for scheduled entries
    const routineIds = [...new Set(entries.map((e) => e.routineId))]
    const routines = await prisma.routine.findMany({
      where: { id: { in: routineIds } },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({
      date: toDateString(date),
      entries,
      routines,
    })
  } catch (error) {
    console.error("[GET /api/calendar/:date]", error)
    return apiError("Error fetching calendar data", 500)
  }
}
```

- [ ] **Step 2: Create range route (used by week/month views)**

```typescript
// app/api/calendar/range/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import {
  getActiveProgramRoutines,
  getRoutinesForDate,
  toDateString,
} from "@/lib/calendar-service"

export async function GET(req: Request) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!from || !to) return apiError("Missing from/to query params (YYYY-MM-DD)", 400)

    const fromDate = new Date(from + "T00:00:00")
    const toDate = new Date(to + "T23:59:59")

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return apiError("Invalid date format. Use YYYY-MM-DD", 400)
    }

    const programRoutines = await getActiveProgramRoutines(user.id, prisma)

    // Compute scheduled entries for each day in range
    const days: Array<{ date: string; routineIds: string[] }> = []
    const cursor = new Date(fromDate)

    while (cursor <= toDate) {
      const entries = getRoutinesForDate(programRoutines, cursor)
      days.push({
        date: toDateString(cursor),
        routineIds: entries.map((e) => e.routineId),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    // Fetch daily logs for the range
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: fromDate, lte: toDate } },
      select: { date: true, routineId: true, status: true, overallRpe: true, durationMin: true },
    })

    return NextResponse.json({ days, dailyLogs: dailyLogs.map(l => ({ ...l, date: toDateString(l.date) })) })
  } catch (error) {
    console.error("[GET /api/calendar/range]", error)
    return apiError("Error fetching calendar range", 500)
  }
}
```

- [ ] **Step 3: Verify routes compile**

```bash
npx tsc --noEmit
```

Expected: no errors in the new files.

- [ ] **Step 4: Manual test with curl (dev server must be running)**

```bash
# Start dev server in another terminal: npm run dev

curl -s "http://localhost:3000/api/calendar/2026-04-07" \
  -H "Cookie: $(cat /dev/stdin)"
# (skip auth for now — will return 401, which is correct behavior)
```

Expected: `{"error":"Unauthorized"}` with 401 status.

- [ ] **Step 5: Commit API routes**

```bash
git add app/api/calendar/
git commit -m "feat(api): add /api/calendar/[date] and /api/calendar/range routes"
```

---

## Task 3: Wire CalendarService into TodayPage

**Files:**
- Modify: `features/session/api/prisma-session-repository.ts`
- Modify: `app/(app)/today/page.tsx`

- [ ] **Step 1: Update getTodayData in prisma-session-repository.ts**

Replace the `getTodayData` method (the stub from Plan A) with:

```typescript
// Replace the getTodayData method in PrismaSessionRepository

async getTodayData(userId: string): Promise<TodayResponse> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [programRoutines, dailyLogs] = await Promise.all([
    getActiveProgramRoutines(userId, prisma),
    this.getTodayLogs(userId),
  ])

  const scheduledEntries = getRoutinesForDate(programRoutines, today)

  if (scheduledEntries.length === 0) {
    return { entries: [], dailyLogs, isRestDay: true }
  }

  const routineIds = [...new Set(scheduledEntries.map((e) => e.routineId))]
  const routines = await prisma.routine.findMany({
    where: { id: { in: routineIds } },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
  })

  const routineMap = new Map(routines.map((r) => [r.id, r]))

  const entries: TodayRoutineEntry[] = scheduledEntries
    .filter((e) => routineMap.has(e.routineId))
    .map((e) => ({
      routineId: e.routineId,
      programRoutineId: e.programRoutineId,
      source: e.source,
      routine: routineMap.get(e.routineId)!,
    }))

  return { entries, dailyLogs, isRestDay: false }
}
```

Add the necessary imports at the top of the file:

```typescript
import { getActiveProgramRoutines, getRoutinesForDate } from "@/lib/calendar-service"
import type { TodayRoutineEntry } from "@/types"
```

- [ ] **Step 2: Update app/(app)/today/page.tsx**

```typescript
// app/(app)/today/page.tsx
import { PrismaSessionRepository } from "@/features/session/api/prisma-session-repository"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { TodaySession } from "@/features/session/components/today-session"
import { getRequiredSession } from "@/lib/get-session"

const sessionRepo = new PrismaSessionRepository()
const exerciseRepo = new PrismaExerciseRepository()

export default async function TodayPage() {
  const user = await getRequiredSession()
  const [todayData, allExercises] = await Promise.all([
    sessionRepo.getTodayData(user.id),
    exerciseRepo.findAll(),
  ])

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <TodaySession
        entries={todayData.entries}
        dailyLogs={todayData.dailyLogs}
        isRestDay={todayData.isRestDay}
        allExercises={allExercises}
        today={today}
      />
    </div>
  )
}
```

- [ ] **Step 3: Update features/session/components/today-session.tsx props**

The component currently accepts `{ routine, dailyLog, allExercises, today }`. Update the props interface to match the new `TodayResponse`:

Read the file first, then update only the props interface and the top-level render:

```typescript
// Updated props at the top of today-session.tsx
"use client"

import type { TodayRoutineEntry, DailyLogWithExercises, Exercise } from "@/types"

interface TodaySessionProps {
  entries: TodayRoutineEntry[]
  dailyLogs: DailyLogWithExercises[]
  isRestDay: boolean
  allExercises: Exercise[]
  today: string
}
```

The component body should render a list of routine cards when `entries.length > 0`, or a rest day card when `isRestDay`. Keep the existing session-execution logic working for the first entry — the multi-routine session flow comes in Plan D.

Minimum viable rendering:

```tsx
export function TodaySession({ entries, dailyLogs, isRestDay, allExercises, today }: TodaySessionProps) {
  if (isRestDay || entries.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold capitalize">{today}</h1>
        <div className="rounded-xl bg-zinc-800 p-6 text-center text-zinc-400">
          <p className="text-lg">Día de descanso</p>
          <p className="text-sm mt-1">No hay rutinas programadas para hoy.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold capitalize">{today}</h1>
      {entries.map((entry) => (
        <div key={entry.programRoutineId} className="rounded-xl bg-zinc-800 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{entry.routine.name}</h2>
            {entry.source !== "PATTERN" && (
              <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full">
                {entry.source === "OVERRIDE_ADDED" ? "Añadida" : "Movida"}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400">
            {entry.routine.exercises.length} ejercicios
          </p>
          <a
            href={`/training/session?routineId=${entry.routineId}&dailyLogId=${
              dailyLogs.find((l) => l.routineId === entry.routineId)?.id ?? ""
            }`}
            className="block w-full text-center bg-zinc-700 hover:bg-zinc-600 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Iniciar sesión
          </a>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual test**

Open http://localhost:3000/today. For today's date (2026-03-31, Tuesday) the seed program starts 2026-04-01, so it will show "Día de descanso". Navigate to http://localhost:3000/today in a browser on a Monday/Wednesday/Friday after 2026-04-01 to see routine cards. ✓

- [ ] **Step 6: Commit**

```bash
git add features/session/ app/(app)/today/
git commit -m "feat(today): wire CalendarService into TodayPage — multi-routine support"
```

---

## Task 4: Create shared calendar types

**Files:**
- Create: `features/calendar/types/calendar.types.ts`

- [ ] **Step 1: Create types file**

```typescript
// features/calendar/types/calendar.types.ts

export type DayStatus = "REST" | "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED"

export interface CalendarDayData {
  date: string           // "YYYY-MM-DD"
  routineIds: string[]   // from CalendarService
  routineNames: string[] // resolved names
  logStatuses: DayStatus[] // one per DailyLog for the day
  isToday: boolean
  isPast: boolean
}

export interface CalendarMonthData {
  year: number
  month: number           // 1-12
  days: CalendarDayData[]
}

export interface CalendarWeekData {
  weekNumber: number
  year: number
  days: CalendarDayData[]
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/calendar/
git commit -m "feat(calendar): add CalendarDayData and month/week types"
```

---

## Task 5: Build RoutineChip component

**Files:**
- Create: `features/calendar/components/routine-chip.tsx`

- [ ] **Step 1: Create component**

```tsx
// features/calendar/components/routine-chip.tsx

interface RoutineChipProps {
  name: string
  status?: "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED" | "REST"
  compact?: boolean
}

const STATUS_COLORS = {
  PENDING: "bg-zinc-700 text-zinc-300",
  COMPLETED: "bg-emerald-900/50 text-emerald-300",
  PARTIAL: "bg-amber-900/50 text-amber-300",
  SKIPPED: "bg-zinc-800 text-zinc-500 line-through",
  REST: "bg-zinc-900 text-zinc-600",
} as const

export function RoutineChip({ name, status = "PENDING", compact = false }: RoutineChipProps) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 font-medium truncate max-w-full ${
        compact ? "text-[10px]" : "text-xs"
      } ${STATUS_COLORS[status]}`}
    >
      {name}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/calendar/components/routine-chip.tsx
git commit -m "feat(calendar): add RoutineChip component"
```

---

## Task 6: Build CalendarMonthView

**Files:**
- Create: `features/calendar/components/calendar-month-view.tsx`
- Create: `app/(app)/calendar/page.tsx`

- [ ] **Step 1: Create CalendarMonthView**

```tsx
// features/calendar/components/calendar-month-view.tsx
"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RoutineChip } from "./routine-chip"
import type { CalendarDayData } from "../types/calendar.types"

interface CalendarMonthViewProps {
  year: number
  month: number    // 1-12
  days: CalendarDayData[]
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getPaddingDays(year: number, month: number): number {
  // ISO week: Monday = 0
  const firstDay = new Date(year, month - 1, 1).getDay()
  return firstDay === 0 ? 6 : firstDay - 1
}

export function CalendarMonthView({ year, month, days }: CalendarMonthViewProps) {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const paddingDays = getPaddingDays(year, month)
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Link
          href={`/calendar?year=${prevYear}&month=${prevMonth}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="font-semibold capitalize">{monthLabel}</h2>
        <Link
          href={`/calendar?year=${nextYear}&month=${nextMonth}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[11px] text-zinc-500 font-medium py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayNum = parseInt(day.date.split("-")[2])
          const hasActivity = day.routineNames.length > 0
          const isCompleted = day.logStatuses.length > 0 && day.logStatuses.every((s) => s === "COMPLETED")
          const isPartial = day.logStatuses.some((s) => s === "PARTIAL" || s === "COMPLETED") && !isCompleted

          return (
            <Link
              key={day.date}
              href={`/calendar/day/${day.date}`}
              className={`min-h-[60px] rounded-lg p-1 flex flex-col gap-0.5 transition-colors ${
                day.isToday
                  ? "ring-2 ring-zinc-400 bg-zinc-800"
                  : "hover:bg-zinc-800/50"
              }`}
            >
              <span
                className={`text-[11px] font-medium self-end leading-none px-1 ${
                  day.isToday ? "text-white" : day.isPast ? "text-zinc-400" : "text-zinc-300"
                }`}
              >
                {dayNum}
              </span>
              {hasActivity && (
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {day.routineNames.slice(0, 2).map((name, i) => (
                    <RoutineChip
                      key={i}
                      name={name}
                      status={
                        day.logStatuses[i] ??
                        (day.isPast ? "SKIPPED" : "PENDING")
                      }
                      compact
                    />
                  ))}
                  {day.routineNames.length > 2 && (
                    <span className="text-[10px] text-zinc-500">
                      +{day.routineNames.length - 2}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create /calendar page.tsx**

```typescript
// app/(app)/calendar/page.tsx
import { getRequiredSession } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { getActiveProgramRoutines, getRoutinesForDate, toDateString } from "@/lib/calendar-service"
import { CalendarMonthView } from "@/features/calendar/components/calendar-month-view"
import type { CalendarDayData } from "@/features/calendar/types/calendar.types"
import type { DayStatus } from "@/features/calendar/types/calendar.types"

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const user = await getRequiredSession()
  const { year: yearParam, month: monthParam } = await searchParams

  const now = new Date()
  const year = yearParam ? parseInt(yearParam) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0, 23, 59, 59, 999)

  const [programRoutines, dailyLogs, routines] = await Promise.all([
    getActiveProgramRoutines(user.id, prisma),
    prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: firstDay, lte: lastDay } },
      select: { date: true, routineId: true, status: true },
    }),
    prisma.routine.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
  ])

  const routineNameMap = new Map(routines.map((r) => [r.id, r.name]))
  const todayStr = toDateString(now)
  const daysInMonth = lastDay.getDate()

  const days: CalendarDayData[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month - 1, d)
    const dateStr = toDateString(dayDate)
    const entries = getRoutinesForDate(programRoutines, dayDate)
    const routineIds = entries.map((e) => e.routineId)
    const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

    days.push({
      date: dateStr,
      routineIds,
      routineNames: routineIds.map((id) => routineNameMap.get(id) ?? id),
      logStatuses: logsForDay.map((l) => l.status as DayStatus),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    })
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <CalendarMonthView year={year} month={month} days={days} />
    </div>
  )
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manual test**

Open http://localhost:3000/calendar. Verify the month grid renders with the correct number of days, weekday labels, and padding. Tap a day to navigate (404 is fine — day view is next task).

- [ ] **Step 5: Commit**

```bash
git add features/calendar/components/calendar-month-view.tsx app/(app)/calendar/page.tsx
git commit -m "feat(calendar): month view with CalendarService integration"
```

---

## Task 7: Build CalendarWeekView and /calendar/week

**Files:**
- Create: `features/calendar/components/calendar-week-view.tsx`
- Create: `app/(app)/calendar/week/page.tsx`

- [ ] **Step 1: Create CalendarWeekView**

```tsx
// features/calendar/components/calendar-week-view.tsx
"use client"

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { RoutineChip } from "./routine-chip"
import type { CalendarDayData } from "../types/calendar.types"

interface CalendarWeekViewProps {
  days: CalendarDayData[]  // exactly 7 days, Monday first
  weekNumber: number
  year: number
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getMondayIso(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split("T")[0]
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

export function CalendarWeekView({ days, weekNumber, year }: CalendarWeekViewProps) {
  const mondayStr = days[0]?.date ?? ""
  const prevMonday = addDays(mondayStr, -7)
  const nextMonday = addDays(mondayStr, 7)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <Link
          href={`/calendar/week?date=${prevMonday}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h2 className="font-semibold">Semana {weekNumber} · {year}</h2>
        <Link
          href={`/calendar/week?date=${nextMonday}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {/* 7 columns */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const dayNum = parseInt(day.date.split("-")[2])
          return (
            <div key={day.date} className="flex flex-col gap-1">
              <div className="text-center">
                <span className="text-[11px] text-zinc-500 block">{DAY_LABELS[i]}</span>
                <span
                  className={`text-sm font-medium block ${
                    day.isToday
                      ? "bg-zinc-300 text-zinc-900 rounded-full w-6 h-6 flex items-center justify-center mx-auto"
                      : "text-zinc-300"
                  }`}
                >
                  {dayNum}
                </span>
              </div>
              <Link
                href={`/calendar/day/${day.date}`}
                className={`min-h-[80px] rounded-lg p-1.5 flex flex-col gap-1 transition-colors ${
                  day.isToday ? "bg-zinc-800 ring-1 ring-zinc-500" : "bg-zinc-900 hover:bg-zinc-800/50"
                }`}
              >
                {day.routineNames.map((name, j) => (
                  <RoutineChip
                    key={j}
                    name={name}
                    status={day.logStatuses[j] ?? (day.isPast ? "SKIPPED" : "PENDING")}
                    compact
                  />
                ))}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create /calendar/week/page.tsx**

```typescript
// app/(app)/calendar/week/page.tsx
import { getRequiredSession } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import { getActiveProgramRoutines, getRoutinesForDate, toDateString } from "@/lib/calendar-service"
import { CalendarWeekView } from "@/features/calendar/components/calendar-week-view"
import type { CalendarDayData, DayStatus } from "@/features/calendar/types/calendar.types"

interface PageProps {
  searchParams: Promise<{ date?: string }>
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export default async function CalendarWeekPage({ searchParams }: PageProps) {
  const user = await getRequiredSession()
  const { date: dateParam } = await searchParams
  const baseDate = dateParam ? new Date(dateParam + "T00:00:00") : new Date()

  const monday = getMondayOfWeek(baseDate)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const [programRoutines, dailyLogs, routines] = await Promise.all([
    getActiveProgramRoutines(user.id, prisma),
    prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: monday, lte: sunday } },
      select: { date: true, routineId: true, status: true },
    }),
    prisma.routine.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    }),
  ])

  const routineNameMap = new Map(routines.map((r) => [r.id, r.name]))
  const todayStr = toDateString(new Date())

  const days: CalendarDayData[] = []
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)
    const dateStr = toDateString(dayDate)
    const entries = getRoutinesForDate(programRoutines, dayDate)
    const routineIds = entries.map((e) => e.routineId)
    const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

    days.push({
      date: dateStr,
      routineIds,
      routineNames: routineIds.map((id) => routineNameMap.get(id) ?? id),
      logStatuses: logsForDay.map((l) => l.status as DayStatus),
      isToday: dateStr === todayStr,
      isPast: dateStr < todayStr,
    })
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <CalendarWeekView
        days={days}
        weekNumber={getWeekNumber(monday)}
        year={monday.getFullYear()}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify and test**

```bash
npx tsc --noEmit
```

Open http://localhost:3000/calendar/week. Verify the 7-column grid renders. Navigate with arrows.

- [ ] **Step 4: Commit**

```bash
git add features/calendar/components/calendar-week-view.tsx app/(app)/calendar/week/
git commit -m "feat(calendar): week view page"
```

---

## Task 8: Build CalendarDayView and /calendar/day/[date]

**Files:**
- Create: `features/calendar/components/calendar-day-view.tsx`
- Create: `app/(app)/calendar/day/[date]/page.tsx`

- [ ] **Step 1: Create CalendarDayView**

```tsx
// features/calendar/components/calendar-day-view.tsx
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { RoutineWithExercises, DailyLogWithExercises } from "@/types"
import type { OverrideSource } from "@/lib/calendar-service"

interface DayEntry {
  routineId: string
  source: OverrideSource
  routine: RoutineWithExercises
  dailyLog: DailyLogWithExercises | null
}

interface CalendarDayViewProps {
  date: string           // "YYYY-MM-DD"
  entries: DayEntry[]
  isRestDay: boolean
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + n)
  return d.toISOString().split("T")[0]
}

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completada",
  PARTIAL: "Parcial",
  SKIPPED: "Omitida",
  PENDING: "Pendiente",
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "text-emerald-400",
  PARTIAL: "text-amber-400",
  SKIPPED: "text-zinc-500",
  PENDING: "text-zinc-400",
}

export function CalendarDayView({ date, entries, isRestDay }: CalendarDayViewProps) {
  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/calendar/day/${addDays(date, -1)}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Día anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold capitalize text-sm">{displayDate}</h1>
        <Link
          href={`/calendar/day/${addDays(date, 1)}`}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label="Día siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      {isRestDay && entries.length === 0 ? (
        <div className="rounded-xl bg-zinc-800 p-8 text-center text-zinc-400">
          <p className="text-lg font-medium">Día de descanso</p>
          <p className="text-sm mt-1">No hay rutinas programadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.routineId} className="rounded-xl bg-zinc-800 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-medium">{entry.routine.name}</h2>
                  <p className="text-xs text-zinc-500">{entry.routine.exercises.length} ejercicios</p>
                </div>
                {entry.dailyLog && (
                  <span className={`text-xs font-medium ${STATUS_COLOR[entry.dailyLog.status] ?? "text-zinc-400"}`}>
                    {STATUS_LABEL[entry.dailyLog.status] ?? entry.dailyLog.status}
                  </span>
                )}
              </div>

              {entry.dailyLog && (
                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  {entry.dailyLog.durationMin && (
                    <div className="bg-zinc-700 rounded-lg p-2">
                      <p className="text-zinc-400">Duración</p>
                      <p className="font-medium">{entry.dailyLog.durationMin}min</p>
                    </div>
                  )}
                  {entry.dailyLog.overallRpe && (
                    <div className="bg-zinc-700 rounded-lg p-2">
                      <p className="text-zinc-400">RPE</p>
                      <p className="font-medium">{entry.dailyLog.overallRpe}/10</p>
                    </div>
                  )}
                  {entry.dailyLog.exerciseLogs.length > 0 && (
                    <div className="bg-zinc-700 rounded-lg p-2">
                      <p className="text-zinc-400">Ejercicios</p>
                      <p className="font-medium">{entry.dailyLog.exerciseLogs.length}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back to calendar */}
      <Link
        href="/calendar"
        className="block text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        ← Volver al calendario
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Create /calendar/day/[date]/page.tsx**

```typescript
// app/(app)/calendar/day/[date]/page.tsx
import { notFound } from "next/navigation"
import { getRequiredSession } from "@/lib/get-session"
import { prisma } from "@/lib/prisma"
import {
  getActiveProgramRoutines,
  getRoutinesForDate,
  toDateString,
} from "@/lib/calendar-service"
import { CalendarDayView } from "@/features/calendar/components/calendar-day-view"

interface PageProps {
  params: Promise<{ date: string }>
}

export default async function CalendarDayPage({ params }: PageProps) {
  const user = await getRequiredSession()
  const { date: dateParam } = await params

  const date = new Date(dateParam + "T00:00:00")
  if (isNaN(date.getTime())) notFound()

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const [programRoutines, dailyLogs, routines] = await Promise.all([
    getActiveProgramRoutines(user.id, prisma),
    prisma.dailyLog.findMany({
      where: { userId: user.id, date: { gte: startOfDay, lte: endOfDay } },
      include: {
        routine: true,
        exerciseLogs: { include: { exercise: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.routine.findMany({
      where: { userId: user.id },
      include: {
        exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
      },
    }),
  ])

  const scheduledEntries = getRoutinesForDate(programRoutines, date)
  const routineMap = new Map(routines.map((r) => [r.id, r]))

  const entries = scheduledEntries
    .filter((e) => routineMap.has(e.routineId))
    .map((e) => ({
      routineId: e.routineId,
      source: e.source,
      routine: routineMap.get(e.routineId)!,
      dailyLog: dailyLogs.find((l) => l.routineId === e.routineId) ?? null,
    }))

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <CalendarDayView
        date={toDateString(date)}
        entries={entries}
        isRestDay={scheduledEntries.length === 0}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manual test**

Open http://localhost:3000/calendar/day/2026-04-07 (Monday after program starts). Verify routine cards render. Open 2026-03-31 (today, before program) — verify "Día de descanso".

- [ ] **Step 5: Commit**

```bash
git add features/calendar/components/calendar-day-view.tsx app/(app)/calendar/day/
git commit -m "feat(calendar): day detail view"
```

---

## Task 9: Update bottom navigation

**Files:**
- Modify: `components/layout/bottom-nav.tsx`

- [ ] **Step 1: Add /calendar tab**

Replace the `NAV_ITEMS` array:

```typescript
import { CalendarDays, Dumbbell, BarChart2, Calendar } from "lucide-react"

const NAV_ITEMS = [
  { href: "/today", label: "Hoy", icon: CalendarDays },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/training", label: "Entrena", icon: Dumbbell },
  { href: "/progress", label: "Progreso", icon: BarChart2 },
]
```

- [ ] **Step 2: Verify compilation and test**

```bash
npx tsc --noEmit
```

Open http://localhost:3000/today on mobile (or with DevTools mobile emulation). Verify 4 tabs in bottom nav. Tap "Calendario" — verify month view loads.

- [ ] **Step 3: Commit**

```bash
git add components/layout/bottom-nav.tsx
git commit -m "feat(nav): add Calendar tab to bottom navigation"
```

---

## Task 10: Wire CalendarService into prisma-training-repository

**Files:**
- Modify: `features/training/api/prisma-training-repository.ts`

The `getWeekData` and `getMonthData` methods currently return empty `routines: []` (stub from Plan A). Wire in the real CalendarService data.

- [ ] **Step 1: Update getWeekData to include scheduled routines**

Add import at the top:
```typescript
import { getActiveProgramRoutines, getRoutinesForDate } from "@/lib/calendar-service"
```

Replace the `getWeekData` method's loop with:

```typescript
async getWeekData(date: Date, userId: string): Promise<WeekData> {
  const monday = getMondayOfWeek(date)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const [programRoutines, dailyLogs, routines] = await Promise.all([
    getActiveProgramRoutines(userId, prisma),
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
      include: { routine: true, _count: { select: { exerciseLogs: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.routine.findMany({
      where: { userId },
      select: { id: true, name: true, sessionType: true, durationMin: true, _count: { select: { exercises: true } } },
    }),
  ])

  const routineMap = new Map(routines.map((r) => [r.id, r]))
  const todayStr = toDateString(new Date())
  const days: WeekDay[] = []

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)
    const dateStr = toDateString(dayDate)
    const entries = getRoutinesForDate(programRoutines, dayDate)
    const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

    days.push({
      date: dateStr,
      dayOfWeek: jsDayToWeekIndex(dayDate.getDay()),
      isToday: dateStr === todayStr,
      isRest: entries.length === 0 && logsForDay.length === 0,
      routines: entries
        .filter((e) => routineMap.has(e.routineId))
        .map((e) => {
          const r = routineMap.get(e.routineId)!
          return {
            routineId: r.id,
            name: r.name,
            exerciseCount: r._count.exercises,
            estimatedDuration: r.durationMin,
            sessionType: r.sessionType,
          }
        }),
      dailyLogs: logsForDay.map((l) => ({
        routineId: l.routineId,
        status: l.status,
        rpeActual: l.overallRpe,
        durationMin: l.durationMin,
        exercisesCompleted: l._count.exerciseLogs,
      })),
    })
  }

  return {
    weekNumber: getWeekNumber(monday),
    year: monday.getFullYear(),
    month: monday.toLocaleDateString("es-MX", { month: "long" }),
    days,
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/training/api/prisma-training-repository.ts
git commit -m "feat(training): wire CalendarService into week and month repository"
```

---

## Plan B Complete

CalendarService is live, `/today` shows multi-routine cards driven by real schedule data, and the three calendar views (`/calendar`, `/calendar/week`, `/calendar/day/[date]`) are navigable. The bottom nav has a Calendario tab.

**Next: Plan C** — CRUD for Collections, Programs, ProgramRoutines, and ScheduleOverrides so users can build and edit their programs.
