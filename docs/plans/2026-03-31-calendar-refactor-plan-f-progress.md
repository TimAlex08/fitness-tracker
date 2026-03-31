# Calendar-First Refactor — Plan F: Progress Dashboard

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.
> **Prerequisite:** Plans D (session) and E (exercises/families) must be complete for full data availability.

**Goal:** Build the progress dashboard at `/progress` with three core visualizations: ExerciseFamilyChart (familyLevel vs time), AdherenceChart (% completed per week), and StreakCounter (current + best streak). Add the family-specific detail page at `/progress/exercise/[familyId]`.

**Architecture:** `ProgressRepository` is rewritten to compute metrics from the new schema. Charts use simple SVG for zero-dependency rendering. Server Components fetch data, thin client wrappers handle interactivity (tooltips, period selection). Data is computed from `DailyLog` + `ExerciseLog` + `ExerciseFamily` tables.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Tailwind, shadcn/ui, Lucide, TypeScript 5

---

## Scope Note

| Plan | Scope |
|---|---|
| A | Schema reset, types, seed |
| B | CalendarService + `/today` + `/calendar` views + nav |
| C | CRUD Collections / Programs / ProgramRoutines / ScheduleOverride |
| D | Session execution refactor (`/training/session`) |
| E | ExerciseFamily + exercise catalog refactor |
| **F (this)** | Progress: charts, adherence, streaks |

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `features/progress/types/dashboard.types.ts` | Dashboard-specific types |
| Modify | `features/progress/api/progress-repository.ts` | Rewrite interface for new metrics |
| Modify | `features/progress/api/prisma-progress-repository.ts` | Implement new metric queries |
| Create | `features/progress/components/streak-counter.tsx` | Current + best streak display |
| Create | `features/progress/components/adherence-chart.tsx` | Weekly adherence % bar chart |
| Create | `features/progress/components/exercise-family-chart.tsx` | familyLevel vs time line chart |
| Create | `features/progress/components/progress-summary-strip.tsx` | Top-level stats strip |
| Create | `features/progress/components/family-selector.tsx` | Dropdown to pick family for chart |
| Modify | `app/(app)/progress/page.tsx` | Rewrite progress dashboard page |
| Create | `app/(app)/progress/exercise/[familyId]/page.tsx` | Family-specific progression page |
| Create | `features/progress/utils/streak.ts` | Streak calculation utility |
| Create | `features/progress/utils/adherence.ts` | Adherence calculation utility |

---

## Task 1: Create dashboard types

**Files:**
- Create: `features/progress/types/dashboard.types.ts`

- [ ] **Step 1: Create types**

```typescript
// features/progress/types/dashboard.types.ts

export interface StreakData {
  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null
}

export interface AdherenceWeek {
  weekLabel: string    // "Sem 14"
  weekStart: string    // "2026-04-06"
  scheduled: number    // rutinas programadas
  completed: number    // rutinas completadas
  percentage: number   // 0–100
}

export interface AdherenceData {
  weeks: AdherenceWeek[]
  overallPercentage: number
}

export interface FamilyProgressionPoint {
  date: string
  exerciseId: string
  exerciseName: string
  familyLevel: number
  familyRole: "MAIN_PATH" | "VARIANT"
  rpeActual: number | null
}

export interface FamilyChartData {
  familyId: string
  familyName: string
  points: FamilyProgressionPoint[]
}

export interface ProgressDashboard {
  streak: StreakData
  adherence: AdherenceData
  recentFamilies: FamilyChartData[]
  totalSessions: number
  totalExercisesLogged: number
  avgRpe: number | null
}
```

- [ ] **Step 2: Commit**

```bash
git add features/progress/types/dashboard.types.ts
git commit -m "feat(progress): add dashboard types"
```

---

## Task 2: Create streak and adherence utilities

**Files:**
- Create: `features/progress/utils/streak.ts`
- Create: `features/progress/utils/adherence.ts`

- [ ] **Step 1: Create streak calculator**

```typescript
// features/progress/utils/streak.ts

interface DayEntry {
  date: string      // "YYYY-MM-DD"
  hasSession: boolean
}

export function calculateStreaks(days: DayEntry[]): { current: number; best: number } {
  // Sort ascending
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))

  let current = 0
  let best = 0
  let streak = 0

  for (const day of sorted) {
    if (day.hasSession) {
      streak++
      if (streak > best) best = streak
    } else {
      streak = 0
    }
  }

  // Current streak: count backwards from today
  current = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].hasSession) {
      current++
    } else {
      break
    }
  }

  return { current, best }
}
```

- [ ] **Step 2: Create adherence calculator**

```typescript
// features/progress/utils/adherence.ts
import type { AdherenceWeek } from "../types/dashboard.types"

interface DayData {
  date: string
  scheduledCount: number
  completedCount: number
}

export function calculateWeeklyAdherence(days: DayData[]): AdherenceWeek[] {
  // Group days by ISO week
  const weekMap = new Map<string, { scheduled: number; completed: number; dates: string[] }>()

  for (const day of days) {
    const d = new Date(day.date + "T00:00:00")
    const weekNum = getISOWeekNumber(d)
    const year = d.getFullYear()
    const key = `${year}-W${weekNum}`

    if (!weekMap.has(key)) {
      weekMap.set(key, { scheduled: 0, completed: 0, dates: [] })
    }
    const w = weekMap.get(key)!
    w.scheduled += day.scheduledCount
    w.completed += day.completedCount
    w.dates.push(day.date)
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, data]) => ({
      weekLabel: `Sem ${key.split("-W")[1]}`,
      weekStart: data.dates.sort()[0],
      scheduled: data.scheduled,
      completed: data.completed,
      percentage: data.scheduled > 0 ? Math.round((data.completed / data.scheduled) * 100) : 0,
    }))
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
```

- [ ] **Step 3: Commit**

```bash
git add features/progress/utils/
git commit -m "feat(progress): add streak and adherence calculation utilities"
```

---

## Task 3: Rewrite ProgressRepository

**Files:**
- Modify: `features/progress/api/progress-repository.ts`
- Modify: `features/progress/api/prisma-progress-repository.ts`

- [ ] **Step 1: Update interface**

```typescript
// features/progress/api/progress-repository.ts
import type { ProgressDashboard, FamilyChartData } from "../types/dashboard.types"

export interface ProgressRepository {
  getDashboard(userId: string): Promise<ProgressDashboard>
  getFamilyProgression(userId: string, familyId: string): Promise<FamilyChartData | null>
}
```

- [ ] **Step 2: Implement getDashboard** — queries:

1. **Streaks**: fetch all DailyLogs with status COMPLETED for the last 90 days, compute via `calculateStreaks`.
2. **Adherence**: for the last 8 weeks, combine CalendarService scheduled routines with actual DailyLogs to get per-week percentages.
3. **Recent families**: find the top 3 families with most recent ExerciseLogs, fetch progression points.
4. **Summary stats**: count total sessions, total exercise logs, average RPE.

```typescript
// Key structure of getDashboard implementation
async getDashboard(userId: string): Promise<ProgressDashboard> {
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [dailyLogs, exerciseLogs, programRoutines] = await Promise.all([
    prisma.dailyLog.findMany({
      where: { userId, date: { gte: ninetyDaysAgo } },
      select: { date: true, status: true, routineId: true, overallRpe: true },
      orderBy: { date: "asc" },
    }),
    prisma.exerciseLog.findMany({
      where: {
        dailyLog: { userId, date: { gte: ninetyDaysAgo } },
        exercise: { familyId: { not: null } },
      },
      include: {
        exercise: { select: { name: true, familyId: true, familyLevel: true, familyRole: true } },
        dailyLog: { select: { date: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getActiveProgramRoutines(userId, prisma),
  ])

  // 1. Streaks
  // 2. Adherence (CalendarService + DailyLogs)
  // 3. Recent families from exerciseLogs
  // 4. Summary stats

  return { streak, adherence, recentFamilies, totalSessions, totalExercisesLogged, avgRpe }
}
```

- [ ] **Step 3: Implement getFamilyProgression** — fetches all ExerciseLogs for exercises in the given family, maps to `FamilyProgressionPoint[]`.

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add features/progress/api/
git commit -m "feat(progress): rewrite ProgressRepository for new dashboard metrics"
```

---

## Task 4: Build StreakCounter component

**Files:**
- Create: `features/progress/components/streak-counter.tsx`

- [ ] **Step 1: Create component**

```tsx
// features/progress/components/streak-counter.tsx
import { Flame, Trophy } from "lucide-react"
import type { StreakData } from "../types/dashboard.types"

interface StreakCounterProps {
  streak: StreakData
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-zinc-800 p-4 text-center space-y-1">
        <Flame className="h-6 w-6 text-orange-400 mx-auto" />
        <p className="text-2xl font-bold">{streak.currentStreak}</p>
        <p className="text-xs text-zinc-500">Racha actual</p>
      </div>
      <div className="rounded-xl bg-zinc-800 p-4 text-center space-y-1">
        <Trophy className="h-6 w-6 text-amber-400 mx-auto" />
        <p className="text-2xl font-bold">{streak.bestStreak}</p>
        <p className="text-xs text-zinc-500">Mejor racha</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/progress/components/streak-counter.tsx
git commit -m "feat(progress): add StreakCounter component"
```

---

## Task 5: Build AdherenceChart component

**Files:**
- Create: `features/progress/components/adherence-chart.tsx`

- [ ] **Step 1: Create component** — horizontal bar chart (SVG) showing weekly adherence %. Each bar is a week with the percentage label. Color coded: >=80% emerald, 50-79% amber, <50% red.

```tsx
// features/progress/components/adherence-chart.tsx
"use client"

import type { AdherenceData } from "../types/dashboard.types"

interface AdherenceChartProps {
  data: AdherenceData
}

function getBarColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500"
  if (pct >= 50) return "bg-amber-500"
  return "bg-red-500"
}

export function AdherenceChart({ data }: AdherenceChartProps) {
  return (
    <div className="rounded-xl bg-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Adherencia semanal</h3>
        <span className="text-xs text-zinc-500">{data.overallPercentage}% global</span>
      </div>
      <div className="space-y-2">
        {data.weeks.map((week) => (
          <div key={week.weekStart} className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 w-12 shrink-0">{week.weekLabel}</span>
            <div className="flex-1 h-4 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(week.percentage)}`}
                style={{ width: `${Math.max(week.percentage, 2)}%` }}
              />
            </div>
            <span className="text-[11px] text-zinc-400 w-10 text-right">
              {week.completed}/{week.scheduled}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/progress/components/adherence-chart.tsx
git commit -m "feat(progress): add AdherenceChart bar chart component"
```

---

## Task 6: Build ExerciseFamilyChart component

**Files:**
- Create: `features/progress/components/exercise-family-chart.tsx`

- [ ] **Step 1: Create component** — SVG line chart:
  - X-axis: dates (last 8 weeks)
  - Y-axis: familyLevel (integer scale)
  - MAIN_PATH points connected with solid line (blue)
  - VARIANT points as standalone dots (purple)
  - Hover tooltip with exercise name + date + RPE

```tsx
// features/progress/components/exercise-family-chart.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import type { FamilyChartData, FamilyProgressionPoint } from "../types/dashboard.types"

interface ExerciseFamilyChartProps {
  data: FamilyChartData
  compact?: boolean
}

export function ExerciseFamilyChart({ data, compact = false }: ExerciseFamilyChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<FamilyProgressionPoint | null>(null)

  if (data.points.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-800 p-4 text-center text-zinc-500 text-sm">
        Sin datos de progresión para {data.familyName}
      </div>
    )
  }

  const mainPoints = data.points.filter((p) => p.familyRole === "MAIN_PATH")
  const variantPoints = data.points.filter((p) => p.familyRole === "VARIANT")

  const maxLevel = Math.max(...data.points.map((p) => p.familyLevel), 5)
  const minLevel = Math.min(...data.points.map((p) => p.familyLevel), 1)

  const width = compact ? 280 : 400
  const height = compact ? 120 : 200
  const padding = { top: 10, right: 10, bottom: 20, left: 30 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom

  function x(i: number, total: number): number {
    return padding.left + (total > 1 ? (i / (total - 1)) * plotW : plotW / 2)
  }

  function y(level: number): number {
    const range = maxLevel - minLevel || 1
    return padding.top + plotH - ((level - minLevel) / range) * plotH
  }

  // Build main path line
  const mainLine = mainPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i, mainPoints.length)} ${y(p.familyLevel)}`)
    .join(" ")

  return (
    <div className="rounded-xl bg-zinc-800 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">{data.familyName}</h3>
        {!compact && (
          <Link
            href={`/progress/exercise/${data.familyId}`}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Ver detalle →
          </Link>
        )}
      </div>

      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Y-axis labels */}
        {Array.from({ length: maxLevel - minLevel + 1 }, (_, i) => minLevel + i).map((level) => (
          <text key={level} x={padding.left - 5} y={y(level)} textAnchor="end" className="fill-zinc-600 text-[9px]">
            Lv.{level}
          </text>
        ))}

        {/* Main path line */}
        {mainLine && <path d={mainLine} fill="none" stroke="#3b82f6" strokeWidth={2} />}

        {/* Main path dots */}
        {mainPoints.map((p, i) => (
          <circle
            key={`main-${i}`}
            cx={x(i, mainPoints.length)}
            cy={y(p.familyLevel)}
            r={4}
            className="fill-blue-400 cursor-pointer"
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}

        {/* Variant dots */}
        {variantPoints.map((p, i) => (
          <circle
            key={`var-${i}`}
            cx={x(i, variantPoints.length)}
            cy={y(p.familyLevel)}
            r={3}
            className="fill-purple-400 cursor-pointer"
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div className="text-[11px] text-zinc-400 text-center">
          {hoveredPoint.exerciseName} · Lv.{hoveredPoint.familyLevel} · {hoveredPoint.date}
          {hoveredPoint.rpeActual && ` · RPE ${hoveredPoint.rpeActual}`}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 justify-center text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Principal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Variante
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/progress/components/exercise-family-chart.tsx
git commit -m "feat(progress): add ExerciseFamilyChart SVG line chart"
```

---

## Task 7: Build ProgressSummaryStrip and FamilySelector

**Files:**
- Create: `features/progress/components/progress-summary-strip.tsx`
- Create: `features/progress/components/family-selector.tsx`

- [ ] **Step 1: Create ProgressSummaryStrip** — horizontal strip with: total sessions, total exercises logged, overall avg RPE.

- [ ] **Step 2: Create FamilySelector** — dropdown of available families. Navigates to `/progress/exercise/[familyId]` on selection.

- [ ] **Step 3: Commit**

```bash
git add features/progress/components/progress-summary-strip.tsx features/progress/components/family-selector.tsx
git commit -m "feat(progress): add summary strip and family selector"
```

---

## Task 8: Rewrite progress dashboard page

**Files:**
- Modify: `app/(app)/progress/page.tsx`

- [ ] **Step 1: Rewrite as RSC** — fetches dashboard data via `PrismaProgressRepository`, renders:

```tsx
// app/(app)/progress/page.tsx
import { getRequiredSession } from "@/lib/get-session"
import { PrismaProgressRepository } from "@/features/progress/api/prisma-progress-repository"
import { StreakCounter } from "@/features/progress/components/streak-counter"
import { AdherenceChart } from "@/features/progress/components/adherence-chart"
import { ExerciseFamilyChart } from "@/features/progress/components/exercise-family-chart"
import { ProgressSummaryStrip } from "@/features/progress/components/progress-summary-strip"

const progressRepo = new PrismaProgressRepository()

export default async function ProgressPage() {
  const user = await getRequiredSession()
  const dashboard = await progressRepo.getDashboard(user.id)

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Progreso</h1>

      <ProgressSummaryStrip
        totalSessions={dashboard.totalSessions}
        totalExercises={dashboard.totalExercisesLogged}
        avgRpe={dashboard.avgRpe}
      />

      <StreakCounter streak={dashboard.streak} />

      <AdherenceChart data={dashboard.adherence} />

      {dashboard.recentFamilies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-zinc-400">Progresión por familia</h2>
          {dashboard.recentFamilies.map((family) => (
            <ExerciseFamilyChart key={family.familyId} data={family} compact />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation and test**

```bash
npx tsc --noEmit
```

Open http://localhost:3000/progress — verify streak, adherence, and family charts render (with real or empty data).

- [ ] **Step 3: Commit**

```bash
git add app/(app)/progress/page.tsx
git commit -m "feat(progress): rewrite dashboard page with new components"
```

---

## Task 9: Create family progression detail page

**Files:**
- Create: `app/(app)/progress/exercise/[familyId]/page.tsx`

- [ ] **Step 1: Create page**

```typescript
// app/(app)/progress/exercise/[familyId]/page.tsx
import { notFound } from "next/navigation"
import { getRequiredSession } from "@/lib/get-session"
import { PrismaProgressRepository } from "@/features/progress/api/prisma-progress-repository"
import { PrismaFamilyRepository } from "@/features/exercises/api/prisma-family-repository"
import { ExerciseFamilyChart } from "@/features/progress/components/exercise-family-chart"
import { FamilyTree } from "@/features/exercises/components/family-tree"

const progressRepo = new PrismaProgressRepository()
const familyRepo = new PrismaFamilyRepository()

interface PageProps {
  params: Promise<{ familyId: string }>
}

export default async function FamilyProgressionPage({ params }: PageProps) {
  const user = await getRequiredSession()
  const { familyId } = await params

  const [chartData, family] = await Promise.all([
    progressRepo.getFamilyProgression(user.id, familyId),
    familyRepo.findById(familyId),
  ])

  if (!family || !chartData) notFound()

  const siblings = family.exercises.map((e) => ({
    id: e.id,
    name: e.name,
    familyLevel: e.familyLevel,
    familyRole: e.familyRole,
    difficulty: e.difficulty,
    isCurrent: false,
  }))

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">{family.name}</h1>
      {family.description && (
        <p className="text-sm text-zinc-400">{family.description}</p>
      )}

      <ExerciseFamilyChart data={chartData} />

      <FamilyTree familyName={family.name} siblings={siblings} />
    </div>
  )
}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add app/(app)/progress/exercise/
git commit -m "feat(progress): add family-specific progression detail page"
```

---

## Task 10: Clean up old progress components

**Files:**
- Remove references to `PhaseInfo` in `features/progress/types/progress.types.ts`
- Remove `features/progress/components/phase-benchmarks.tsx` (uses old Phase model)
- Update any remaining components that reference old types

- [ ] **Step 1: Update progress.types.ts** — remove `PhaseInfo` type and `phase` field from `ProgressData` (or delete the file entirely if `dashboard.types.ts` replaces it).

- [ ] **Step 2: Clean up old components** — remove or stub out `phase-benchmarks.tsx` which references the removed Phase model.

- [ ] **Step 3: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Final commit**

```bash
git add features/progress/ app/(app)/progress/
git commit -m "feat(progress): complete progress dashboard refactor — remove old Phase references"
```

---

## Plan F Complete

The progress dashboard now shows:
- **StreakCounter**: current streak and best streak (fire + trophy icons)
- **AdherenceChart**: weekly adherence as horizontal bar chart, color-coded by percentage
- **ExerciseFamilyChart**: familyLevel vs time with MAIN_PATH line and VARIANT dots
- **ProgressSummaryStrip**: total sessions, exercises logged, average RPE
- **Family detail page**: full progression chart + family tree at `/progress/exercise/[familyId]`

---

## All Plans Complete

The calendar-first refactoring is fully specified across 6 plans:

| Plan | Delivers |
|---|---|
| A – Foundation | New schema, types, seed |
| B – Calendar | CalendarService, /today, /calendar views |
| C – Programs | CRUD Collections/Programs/ProgramRoutines/Overrides |
| D – Session | Multi-routine sessions, SCHEDULED/AD_HOC source |
| E – Exercises | ExerciseFamily entity, family tree, catalog refactor |
| F – Progress | Dashboard with streaks, adherence, family progression |
