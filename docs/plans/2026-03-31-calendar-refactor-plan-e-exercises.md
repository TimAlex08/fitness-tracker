# Calendar-First Refactor — Plan E: ExerciseFamily + Exercise Catalog

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.
> **Prerequisite:** Plan A (schema, types, seed) must be complete. Independent of Plans C and D.

**Goal:** Make `ExerciseFamily` a first-class visible entity. Refactor the exercise catalog to show family grouping, familyLevel, and familyRole. Build the `/training/exercises/[id]` detail page with a basic family progression chart. Add a family selector to the exercise form.

**Architecture:** `ExerciseRepository` is extended with family-aware queries. The exercise list groups by family when possible. The detail page shows the exercise's family tree (siblings sorted by familyLevel) and a basic chart placeholder wired to ExerciseLog history.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Tailwind, shadcn/ui, Lucide, TypeScript 5

---

## Scope Note

| Plan | Scope |
|---|---|
| A | Schema reset, types, seed |
| B | CalendarService + `/today` + `/calendar` views + nav |
| C | CRUD Collections / Programs / ProgramRoutines / ScheduleOverride |
| D | Session execution refactor (`/training/session`) |
| **E (this)** | ExerciseFamily + exercise catalog refactor |
| F | Progress: charts, adherence, streaks |

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `features/exercises/api/family-repository.ts` | ExerciseFamily repository interface |
| Create | `features/exercises/api/prisma-family-repository.ts` | Prisma implementation |
| Modify | `features/exercises/api/exercise-repository.ts` | Add family-aware query types |
| Modify | `features/exercises/api/prisma-exercise-repository.ts` | Include family in queries |
| Create | `features/exercises/types/family.types.ts` | Family-specific types |
| Create | `app/api/families/route.ts` | List + create ExerciseFamilies |
| Create | `app/api/families/[id]/route.ts` | Get, update, delete Family |
| Modify | `features/exercises/components/exercise-card.tsx` | Show family badge + familyLevel |
| Modify | `features/exercises/components/exercise-form.tsx` | Add family/level/role selector |
| Create | `features/exercises/components/family-badge.tsx` | Colored badge for family name |
| Create | `features/exercises/components/family-tree.tsx` | Visual tree of siblings by level |
| Create | `features/exercises/components/family-progression-chart.tsx` | familyLevel vs time chart |
| Modify | `app/(app)/training/exercises/[id]/page.tsx` | Enhanced detail with family tree + chart |
| Modify | `features/exercises/components/exercise-filters.tsx` | Add family filter option |

---

## Task 1: Create family-specific types

**Files:**
- Create: `features/exercises/types/family.types.ts`

- [ ] **Step 1: Create types**

```typescript
// features/exercises/types/family.types.ts
import type { Exercise, ExerciseFamily } from "@prisma/client"

export interface FamilyWithExercises extends ExerciseFamily {
  exercises: Exercise[]
}

export interface FamilySibling {
  id: string
  name: string
  familyLevel: number | null
  familyRole: string | null
  difficulty: number
  isCurrent: boolean
}

export interface FamilyProgressionPoint {
  date: string
  exerciseName: string
  familyLevel: number
  familyRole: string
  rpeActual: number | null
}
```

- [ ] **Step 2: Commit**

```bash
git add features/exercises/types/family.types.ts
git commit -m "feat(exercises): add ExerciseFamily types"
```

---

## Task 2: Create ExerciseFamily repository

**Files:**
- Create: `features/exercises/api/family-repository.ts`
- Create: `features/exercises/api/prisma-family-repository.ts`

- [ ] **Step 1: Create interface**

```typescript
// features/exercises/api/family-repository.ts
import type { ExerciseFamily } from "@prisma/client"
import type { FamilyWithExercises } from "../types/family.types"

export interface CreateFamilyInput {
  name: string
  slug: string
  description?: string
}

export interface FamilyRepository {
  findAll(): Promise<FamilyWithExercises[]>
  findById(id: string): Promise<FamilyWithExercises | null>
  findBySlug(slug: string): Promise<FamilyWithExercises | null>
  create(input: CreateFamilyInput): Promise<ExerciseFamily>
  update(id: string, input: Partial<CreateFamilyInput>): Promise<ExerciseFamily>
  delete(id: string): Promise<void>
}
```

- [ ] **Step 2: Create Prisma implementation**

```typescript
// features/exercises/api/prisma-family-repository.ts
import { prisma } from "@/lib/prisma"
import type { ExerciseFamily } from "@prisma/client"
import type { FamilyWithExercises } from "../types/family.types"
import type { FamilyRepository, CreateFamilyInput } from "./family-repository"

export class PrismaFamilyRepository implements FamilyRepository {
  async findAll(): Promise<FamilyWithExercises[]> {
    return prisma.exerciseFamily.findMany({
      include: { exercises: { orderBy: { familyLevel: "asc" } } },
      orderBy: { name: "asc" },
    })
  }

  async findById(id: string): Promise<FamilyWithExercises | null> {
    return prisma.exerciseFamily.findUnique({
      where: { id },
      include: { exercises: { orderBy: { familyLevel: "asc" } } },
    })
  }

  async findBySlug(slug: string): Promise<FamilyWithExercises | null> {
    return prisma.exerciseFamily.findUnique({
      where: { slug },
      include: { exercises: { orderBy: { familyLevel: "asc" } } },
    })
  }

  async create(input: CreateFamilyInput): Promise<ExerciseFamily> {
    return prisma.exerciseFamily.create({ data: input })
  }

  async update(id: string, input: Partial<CreateFamilyInput>): Promise<ExerciseFamily> {
    return prisma.exerciseFamily.update({ where: { id }, data: input })
  }

  async delete(id: string): Promise<void> {
    await prisma.exerciseFamily.delete({ where: { id } })
  }
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add features/exercises/api/family-repository.ts features/exercises/api/prisma-family-repository.ts
git commit -m "feat(exercises): add ExerciseFamily repository"
```

---

## Task 3: Create family API routes

**Files:**
- Create: `app/api/families/route.ts`
- Create: `app/api/families/[id]/route.ts`

- [ ] **Step 1: Create list + create route** — GET returns all families with exercises, POST creates new family.

- [ ] **Step 2: Create single-family route** — GET returns family with exercises, PUT updates, DELETE removes.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add app/api/families/
git commit -m "feat(api): add /api/families CRUD routes"
```

---

## Task 4: Update exercise repository for family support

**Files:**
- Modify: `features/exercises/api/exercise-repository.ts`
- Modify: `features/exercises/api/prisma-exercise-repository.ts`

- [ ] **Step 1: Add family filter** — extend `ExerciseFilters` with optional `familyId: string`.

- [ ] **Step 2: Update findMany** — include `family` relation in the query. Filter by `familyId` when provided.

- [ ] **Step 3: Update `ExerciseCardData`** — ensure it includes `familyId`, `familyLevel`, `familyRole`, and `family: { name } | null`.

- [ ] **Step 4: Update findById** — already includes family from Plan A stub. Ensure the `exerciseLogs` query includes dates for the progression chart.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit
git add features/exercises/api/
git commit -m "feat(exercises): add family support to exercise repository"
```

---

## Task 5: Build FamilyBadge component

**Files:**
- Create: `features/exercises/components/family-badge.tsx`

- [ ] **Step 1: Create component**

```tsx
// features/exercises/components/family-badge.tsx

interface FamilyBadgeProps {
  familyName: string
  familyLevel?: number | null
  familyRole?: string | null
}

const ROLE_STYLES = {
  MAIN_PATH: "bg-blue-900/40 text-blue-300 border-blue-800/50",
  VARIANT: "bg-purple-900/40 text-purple-300 border-purple-800/50",
} as const

export function FamilyBadge({ familyName, familyLevel, familyRole }: FamilyBadgeProps) {
  const roleStyle = familyRole
    ? ROLE_STYLES[familyRole as keyof typeof ROLE_STYLES] ?? "bg-zinc-800 text-zinc-400"
    : "bg-zinc-800 text-zinc-400"

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleStyle}`}>
        {familyName}
        {familyLevel != null && (
          <span className="text-[10px] opacity-70">Lv.{familyLevel}</span>
        )}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/exercises/components/family-badge.tsx
git commit -m "feat(exercises): add FamilyBadge component"
```

---

## Task 6: Build FamilyTree component

**Files:**
- Create: `features/exercises/components/family-tree.tsx`

- [ ] **Step 1: Create component** — vertical list of siblings sorted by familyLevel. Highlights the current exercise. Shows MAIN_PATH vs VARIANT role.

```tsx
// features/exercises/components/family-tree.tsx
import Link from "next/link"
import type { FamilySibling } from "../types/family.types"

interface FamilyTreeProps {
  familyName: string
  siblings: FamilySibling[]
}

export function FamilyTree({ familyName, siblings }: FamilyTreeProps) {
  return (
    <div className="rounded-xl bg-zinc-800 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-300">
        Familia: {familyName}
      </h3>
      <div className="space-y-1">
        {siblings.map((s) => (
          <Link
            key={s.id}
            href={`/training/exercises/${s.id}`}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              s.isCurrent
                ? "bg-zinc-600 text-white"
                : "hover:bg-zinc-700 text-zinc-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 text-xs text-zinc-500 text-right">
                {s.familyLevel != null ? `Lv.${s.familyLevel}` : "—"}
              </span>
              <span>{s.name}</span>
            </div>
            <span className={`text-[10px] ${
              s.familyRole === "MAIN_PATH" ? "text-blue-400" : "text-purple-400"
            }`}>
              {s.familyRole === "MAIN_PATH" ? "Principal" : "Variante"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/exercises/components/family-tree.tsx
git commit -m "feat(exercises): add FamilyTree sibling visualization"
```

---

## Task 7: Build FamilyProgressionChart

**Files:**
- Create: `features/exercises/components/family-progression-chart.tsx`

- [ ] **Step 1: Create chart component** — basic SVG/canvas line chart showing familyLevel on Y-axis and date on X-axis. Each point represents an ExerciseLog for any exercise in the family. MAIN_PATH points as solid line, VARIANT points as dots. Minimal, clean design.

Implementation note: Use a simple SVG chart since the project doesn't have a charting library. The chart plots progression data points with:
- X: date (evenly spaced)
- Y: familyLevel (integer scale)
- Color coding: blue for MAIN_PATH, purple for VARIANT
- Tooltip on hover showing exercise name + date

- [ ] **Step 2: Wire data** — the detail page will fetch ExerciseLogs for the entire family and transform them into `FamilyProgressionPoint[]`.

- [ ] **Step 3: Commit**

```bash
git add features/exercises/components/family-progression-chart.tsx
git commit -m "feat(exercises): add basic FamilyProgressionChart (SVG)"
```

---

## Task 8: Update ExerciseCard to show family info

**Files:**
- Modify: `features/exercises/components/exercise-card.tsx`

- [ ] **Step 1: Add FamilyBadge** — show family name and level in the card when the exercise belongs to a family.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add features/exercises/components/exercise-card.tsx
git commit -m "feat(exercises): show family info in exercise card"
```

---

## Task 9: Update ExerciseForm with family selector

**Files:**
- Modify: `features/exercises/components/exercise-form.tsx`

- [ ] **Step 1: Add family fields** — three new form fields:
  - **Family**: select dropdown populated from `/api/families` (+ "Sin familia" option)
  - **Level**: numeric input (1–10), shown only when family is selected
  - **Role**: select with MAIN_PATH / VARIANT, shown only when family is selected

- [ ] **Step 2: Add "Create new family" inline** — small link/button below the family select that opens a quick-create form (name + slug).

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit
git add features/exercises/components/exercise-form.tsx
git commit -m "feat(exercises): add family selector to exercise form"
```

---

## Task 10: Update exercise detail page

**Files:**
- Modify: `app/(app)/training/exercises/[id]/page.tsx`

- [ ] **Step 1: Enhance the detail page** — fetch family siblings and exercise logs for the family. Render:
  - Exercise info (existing)
  - FamilyBadge (if family exists)
  - FamilyTree (if family exists, showing siblings)
  - FamilyProgressionChart (if family has enough log data)
  - Exercise history (existing)

- [ ] **Step 2: Verify and test**

```bash
npx tsc --noEmit
```

Open `/training/exercises/[id]` for an exercise that belongs to a family. Verify family tree renders with correct siblings and levels.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/training/exercises/
git commit -m "feat(exercises): enhanced detail page with family tree and progression chart"
```

---

## Task 11: Add family filter to exercise list

**Files:**
- Modify: `features/exercises/components/exercise-filters.tsx`

- [ ] **Step 1: Add family dropdown filter** — fetch families via `/api/families` and add a select to the filter bar. When selected, filter exercises by `familyId`.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add features/exercises/components/exercise-filters.tsx
git commit -m "feat(exercises): add family filter to exercise catalog"
```

---

## Plan E Complete

`ExerciseFamily` is now a visible, manageable entity. The exercise catalog shows family badges and levels, exercises can be assigned to families with roles (MAIN_PATH/VARIANT), and the detail page shows a family tree with sibling progressions. A basic SVG chart visualizes familyLevel progression over time.

**Next: Plan F** — Progress dashboard with ExerciseFamilyChart, AdherenceChart, and StreakCounter.
