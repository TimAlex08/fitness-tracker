# Calendar-First Refactor — Plan C: Programs CRUD

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.
> **Prerequisite:** Plan A (schema, types, seed) and Plan B (CalendarService, calendar views) must be complete.

**Goal:** Full CRUD for Collections, Programs, ProgramRoutines, and ScheduleOverrides. The user can create/edit their training plan and see changes reflected instantly in the calendar.

**Architecture:** Repository pattern with `ProgramRepository` expanded to include mutations. API routes handle validation via Zod schemas. RSC pages for listing, client components for forms/modals. `revalidateTag` after every mutation to keep calendar views in sync.

**Tech Stack:** Next.js 16 App Router, Prisma 7, Tailwind, shadcn/ui, Zod, TypeScript 5

---

## Scope Note

| Plan | Scope |
|---|---|
| A | Schema reset, types, seed |
| B | CalendarService + `/today` + `/calendar` views + nav |
| **C (this)** | CRUD Collections / Programs / ProgramRoutines / ScheduleOverride |
| D | Session execution refactor (`/training/session`) |
| E | ExerciseFamily + exercise catalog refactor |
| F | Progress: charts, adherence, streaks |

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `features/programs/schemas/program.schemas.ts` | Zod schemas for all program entities |
| Modify | `features/programs/api/program-repository.ts` | Expand interface with mutation methods |
| Modify | `features/programs/api/prisma-program-repository.ts` | Implement all CRUD operations |
| Create | `app/api/collections/route.ts` | List + create Collections |
| Create | `app/api/collections/[id]/route.ts` | Get, update, delete Collection |
| Create | `app/api/collections/[id]/activate/route.ts` | Activate a Collection (deactivate others) |
| Create | `app/api/programs/route.ts` | Replace existing — list + create Programs |
| Modify | `app/api/programs/[id]/route.ts` | Get, update, delete Program |
| Create | `app/api/programs/[id]/activate/route.ts` | Activate a Program within Collection |
| Create | `app/api/program-routines/route.ts` | Create ProgramRoutine |
| Create | `app/api/program-routines/[id]/route.ts` | Update, delete ProgramRoutine |
| Create | `app/api/schedule-override/route.ts` | Create ScheduleOverride |
| Create | `app/api/schedule-override/[id]/route.ts` | Update, delete ScheduleOverride |
| Create | `app/(app)/training/collections/page.tsx` | Collections list page |
| Create | `app/(app)/training/collections/[id]/page.tsx` | Collection detail — programs list |
| Create | `app/(app)/training/programs/[id]/page.tsx` | Program detail — routines + recurrence |
| Create | `features/programs/components/collection-list.tsx` | Collection cards with active badge |
| Create | `features/programs/components/collection-form.tsx` | Create/edit Collection form |
| Create | `features/programs/components/program-list.tsx` | Programs within a collection |
| Replace | `features/programs/components/program-form.tsx` | Create/edit Program with dates |
| Create | `features/programs/components/program-routine-editor.tsx` | Assign routine + recurrenceDays |
| Create | `features/programs/components/schedule-override-modal.tsx` | MOVED/CANCELLED/ADDED override |
| Create | `features/programs/components/recurrence-day-picker.tsx` | 7 day checkboxes MON–SUN |

---

## Task 1: Create Zod validation schemas

**Files:**
- Create: `features/programs/schemas/program.schemas.ts`

- [ ] **Step 1: Create the schemas file**

```typescript
// features/programs/schemas/program.schemas.ts
import { z } from "zod"

// ─── Collection ───────────────────────────────────────────────────────────────

export const createCollectionSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
})

export const updateCollectionSchema = createCollectionSchema.partial()

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>

// ─── Program ──────────────────────────────────────────────────────────────────

export const createProgramSchema = z.object({
  collectionId: z.string().min(1),
  name: z.string().min(1, "El nombre es requerido").max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  rpeTarget: z.string().max(20).optional(),
})

export const updateProgramSchema = createProgramSchema.omit({ collectionId: true }).partial()

export type CreateProgramInput = z.infer<typeof createProgramSchema>
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>

// ─── ProgramRoutine ───────────────────────────────────────────────────────────

const dayAbbr = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"])

export const createProgramRoutineSchema = z.object({
  programId: z.string().min(1),
  routineId: z.string().min(1),
  recurrenceDays: z.array(dayAbbr).min(1, "Selecciona al menos un día"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const updateProgramRoutineSchema = createProgramRoutineSchema
  .omit({ programId: true, routineId: true })
  .partial()

export type CreateProgramRoutineInput = z.infer<typeof createProgramRoutineSchema>
export type UpdateProgramRoutineInput = z.infer<typeof updateProgramRoutineSchema>

// ─── ScheduleOverride ─────────────────────────────────────────────────────────

export const createScheduleOverrideSchema = z.object({
  programRoutineId: z.string().min(1),
  type: z.enum(["MOVED", "CANCELLED", "ADDED"]),
  originalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  routineId: z.string().optional(),
  notes: z.string().max(300).optional(),
})

export type CreateScheduleOverrideInput = z.infer<typeof createScheduleOverrideSchema>
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add features/programs/schemas/
git commit -m "feat(programs): add Zod validation schemas for program entities"
```

---

## Task 2: Expand ProgramRepository interface

**Files:**
- Modify: `features/programs/api/program-repository.ts`

- [ ] **Step 1: Replace with full CRUD interface**

```typescript
// features/programs/api/program-repository.ts
import type { Collection, Program, ProgramRoutine, ScheduleOverride } from "@prisma/client"
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  CreateProgramInput,
  UpdateProgramInput,
  CreateProgramRoutineInput,
  UpdateProgramRoutineInput,
  CreateScheduleOverrideInput,
} from "../schemas/program.schemas"

export interface ProgramRepository {
  // Collections
  getCollections(userId: string): Promise<CollectionWithPrograms[]>
  getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null>
  createCollection(userId: string, input: CreateCollectionInput): Promise<Collection>
  updateCollection(id: string, userId: string, input: UpdateCollectionInput): Promise<Collection>
  deleteCollection(id: string, userId: string): Promise<void>
  activateCollection(id: string, userId: string): Promise<Collection>

  // Programs
  getActiveProgram(userId: string): Promise<ProgramWithRoutines | null>
  getProgram(id: string): Promise<ProgramWithRoutines | null>
  createProgram(input: CreateProgramInput): Promise<Program>
  updateProgram(id: string, input: UpdateProgramInput): Promise<Program>
  deleteProgram(id: string): Promise<void>
  activateProgram(id: string): Promise<Program>

  // ProgramRoutines
  createProgramRoutine(input: CreateProgramRoutineInput): Promise<ProgramRoutine>
  updateProgramRoutine(id: string, input: UpdateProgramRoutineInput): Promise<ProgramRoutine>
  deleteProgramRoutine(id: string): Promise<void>

  // ScheduleOverrides
  createScheduleOverride(input: CreateScheduleOverrideInput): Promise<ScheduleOverride>
  deleteScheduleOverride(id: string): Promise<void>
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

---

## Task 3: Implement PrismaProgramRepository mutations

**Files:**
- Modify: `features/programs/api/prisma-program-repository.ts`

- [ ] **Step 1: Replace with full implementation**

Read existing file first, then add all mutation methods. Key patterns:

```typescript
// features/programs/api/prisma-program-repository.ts
import { prisma } from "@/lib/prisma"
import type { Collection, Program, ProgramRoutine, ScheduleOverride } from "@prisma/client"
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"
import type { ProgramRepository } from "./program-repository"
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
  CreateProgramInput,
  UpdateProgramInput,
  CreateProgramRoutineInput,
  UpdateProgramRoutineInput,
  CreateScheduleOverrideInput,
} from "../schemas/program.schemas"

export class PrismaProgramRepository implements ProgramRepository {
  // ─── Collections ──────────────────────────────────────────────────────────

  async getCollections(userId: string): Promise<CollectionWithPrograms[]> {
    return prisma.collection.findMany({
      where: { userId },
      include: { programs: { orderBy: { startDate: "desc" } } },
      orderBy: { createdAt: "desc" },
    })
  }

  async getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null> {
    return prisma.collection.findFirst({
      where: { id, userId },
      include: { programs: { orderBy: { startDate: "desc" } } },
    })
  }

  async createCollection(userId: string, input: CreateCollectionInput): Promise<Collection> {
    return prisma.collection.create({
      data: { userId, name: input.name, description: input.description },
    })
  }

  async updateCollection(id: string, userId: string, input: UpdateCollectionInput): Promise<Collection> {
    return prisma.collection.update({
      where: { id },
      data: { name: input.name, description: input.description },
    })
  }

  async deleteCollection(id: string, userId: string): Promise<void> {
    await prisma.collection.delete({ where: { id } })
  }

  async activateCollection(id: string, userId: string): Promise<Collection> {
    // Deactivate all user's collections, then activate this one
    await prisma.collection.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    })
    return prisma.collection.update({
      where: { id },
      data: { isActive: true },
    })
  }

  // ─── Programs ─────────────────────────────────────────────────────────────

  async getActiveProgram(userId: string): Promise<ProgramWithRoutines | null> {
    const collection = await prisma.collection.findFirst({
      where: { userId, isActive: true },
      include: { programs: { where: { isActive: true }, take: 1 } },
    })
    if (!collection?.programs[0]) return null
    return this.getProgram(collection.programs[0].id)
  }

  async getProgram(id: string): Promise<ProgramWithRoutines | null> {
    return prisma.program.findUnique({
      where: { id },
      include: {
        programRoutines: {
          include: {
            routine: {
              include: {
                exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
              },
            },
            overrides: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    })
  }

  async createProgram(input: CreateProgramInput): Promise<Program> {
    return prisma.program.create({
      data: {
        collectionId: input.collectionId,
        name: input.name,
        description: input.description,
        startDate: new Date(input.startDate + "T00:00:00"),
        endDate: input.endDate ? new Date(input.endDate + "T00:00:00") : undefined,
        rpeTarget: input.rpeTarget,
      },
    })
  }

  async updateProgram(id: string, input: UpdateProgramInput): Promise<Program> {
    return prisma.program.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        startDate: input.startDate ? new Date(input.startDate + "T00:00:00") : undefined,
        endDate: input.endDate ? new Date(input.endDate + "T00:00:00") : undefined,
        rpeTarget: input.rpeTarget,
      },
    })
  }

  async deleteProgram(id: string): Promise<void> {
    await prisma.program.delete({ where: { id } })
  }

  async activateProgram(id: string): Promise<Program> {
    const program = await prisma.program.findUniqueOrThrow({ where: { id } })
    // Deactivate siblings, activate this one
    await prisma.program.updateMany({
      where: { collectionId: program.collectionId, isActive: true },
      data: { isActive: false },
    })
    return prisma.program.update({ where: { id }, data: { isActive: true } })
  }

  // ─── ProgramRoutines ──────────────────────────────────────────────────────

  async createProgramRoutine(input: CreateProgramRoutineInput): Promise<ProgramRoutine> {
    return prisma.programRoutine.create({
      data: {
        programId: input.programId,
        routineId: input.routineId,
        recurrenceDays: input.recurrenceDays,
        startDate: input.startDate ? new Date(input.startDate + "T00:00:00") : undefined,
        endDate: input.endDate ? new Date(input.endDate + "T00:00:00") : undefined,
      },
    })
  }

  async updateProgramRoutine(id: string, input: UpdateProgramRoutineInput): Promise<ProgramRoutine> {
    return prisma.programRoutine.update({
      where: { id },
      data: {
        recurrenceDays: input.recurrenceDays,
        startDate: input.startDate ? new Date(input.startDate + "T00:00:00") : undefined,
        endDate: input.endDate ? new Date(input.endDate + "T00:00:00") : undefined,
      },
    })
  }

  async deleteProgramRoutine(id: string): Promise<void> {
    await prisma.programRoutine.delete({ where: { id } })
  }

  // ─── ScheduleOverrides ────────────────────────────────────────────────────

  async createScheduleOverride(input: CreateScheduleOverrideInput): Promise<ScheduleOverride> {
    return prisma.scheduleOverride.create({
      data: {
        programRoutineId: input.programRoutineId,
        type: input.type,
        originalDate: input.originalDate ? new Date(input.originalDate + "T00:00:00") : undefined,
        newDate: input.newDate ? new Date(input.newDate + "T00:00:00") : undefined,
        routineId: input.routineId,
        notes: input.notes,
      },
    })
  }

  async deleteScheduleOverride(id: string): Promise<void> {
    await prisma.scheduleOverride.delete({ where: { id } })
  }
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add features/programs/api/
git commit -m "feat(programs): implement full CRUD in PrismaProgramRepository"
```

---

## Task 4: Create Collection API routes

**Files:**
- Create: `app/api/collections/route.ts`
- Create: `app/api/collections/[id]/route.ts`
- Create: `app/api/collections/[id]/activate/route.ts`

- [ ] **Step 1: Create list + create route**

```typescript
// app/api/collections/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"
import { createCollectionSchema } from "@/features/programs/schemas/program.schemas"

const repo = new PrismaProgramRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const collections = await repo.getCollections(user.id)
    return NextResponse.json(collections)
  } catch (error) {
    console.error("[GET /api/collections]", error)
    return apiError("Error fetching collections", 500)
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const body = await req.json()
    const parsed = createCollectionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)
    const collection = await repo.createCollection(user.id, parsed.data)
    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error("[POST /api/collections]", error)
    return apiError("Error creating collection", 500)
  }
}
```

- [ ] **Step 2: Create single-collection route**

```typescript
// app/api/collections/[id]/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"
import { updateCollectionSchema } from "@/features/programs/schemas/program.schemas"

const repo = new PrismaProgramRepository()

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    const collection = await repo.getCollection(id, user.id)
    if (!collection) return apiError("Collection not found", 404)
    return NextResponse.json(collection)
  } catch (error) {
    console.error("[GET /api/collections/:id]", error)
    return apiError("Error fetching collection", 500)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    const body = await req.json()
    const parsed = updateCollectionSchema.safeParse(body)
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400)
    const updated = await repo.updateCollection(id, user.id, parsed.data)
    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PUT /api/collections/:id]", error)
    return apiError("Error updating collection", 500)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    await repo.deleteCollection(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/collections/:id]", error)
    return apiError("Error deleting collection", 500)
  }
}
```

- [ ] **Step 3: Create activate route**

```typescript
// app/api/collections/[id]/activate/route.ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"

const repo = new PrismaProgramRepository()

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)
    const { id } = await params
    const collection = await repo.activateCollection(id, user.id)
    return NextResponse.json(collection)
  } catch (error) {
    console.error("[POST /api/collections/:id/activate]", error)
    return apiError("Error activating collection", 500)
  }
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit
git add app/api/collections/
git commit -m "feat(api): add /api/collections CRUD + activate routes"
```

---

## Task 5: Create Program, ProgramRoutine, and ScheduleOverride API routes

**Files:**
- Replace: `app/api/programs/route.ts`
- Modify: `app/api/programs/[id]/route.ts`
- Create: `app/api/programs/[id]/activate/route.ts`
- Create: `app/api/program-routines/route.ts`
- Create: `app/api/program-routines/[id]/route.ts`
- Create: `app/api/schedule-override/route.ts`
- Create: `app/api/schedule-override/[id]/route.ts`

Follow the same pattern as Task 4 for all routes. Each route:
1. Authenticates via `getSession()`
2. Validates input via Zod schema
3. Delegates to `PrismaProgramRepository`
4. Returns JSON response

- [ ] **Step 1: Replace programs routes** — same pattern, use `createProgramSchema`/`updateProgramSchema`
- [ ] **Step 2: Create program activate route**
- [ ] **Step 3: Create program-routines routes** — use `createProgramRoutineSchema`/`updateProgramRoutineSchema`
- [ ] **Step 4: Create schedule-override routes** — use `createScheduleOverrideSchema`
- [ ] **Step 5: Verify all routes compile**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit all API routes**

```bash
git add app/api/programs/ app/api/program-routines/ app/api/schedule-override/
git commit -m "feat(api): add Program, ProgramRoutine, ScheduleOverride CRUD routes"
```

---

## Task 6: Build RecurrenceDayPicker component

**Files:**
- Create: `features/programs/components/recurrence-day-picker.tsx`

- [ ] **Step 1: Create component**

```tsx
// features/programs/components/recurrence-day-picker.tsx
"use client"

interface RecurrenceDayPickerProps {
  selected: string[]
  onChange: (days: string[]) => void
  disabled?: boolean
}

const DAYS = [
  { abbr: "MON", label: "L" },
  { abbr: "TUE", label: "M" },
  { abbr: "WED", label: "X" },
  { abbr: "THU", label: "J" },
  { abbr: "FRI", label: "V" },
  { abbr: "SAT", label: "S" },
  { abbr: "SUN", label: "D" },
] as const

export function RecurrenceDayPicker({ selected, onChange, disabled }: RecurrenceDayPickerProps) {
  function toggle(abbr: string) {
    if (disabled) return
    onChange(
      selected.includes(abbr)
        ? selected.filter((d) => d !== abbr)
        : [...selected, abbr]
    )
  }

  return (
    <div className="flex gap-1.5">
      {DAYS.map((day) => {
        const isActive = selected.includes(day.abbr)
        return (
          <button
            key={day.abbr}
            type="button"
            disabled={disabled}
            onClick={() => toggle(day.abbr)}
            className={`w-9 h-9 rounded-full text-xs font-semibold transition-colors ${
              isActive
                ? "bg-zinc-200 text-zinc-900"
                : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {day.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add features/programs/components/recurrence-day-picker.tsx
git commit -m "feat(programs): add RecurrenceDayPicker component"
```

---

## Task 7: Build Collection list and form components

**Files:**
- Create: `features/programs/components/collection-list.tsx`
- Create: `features/programs/components/collection-form.tsx`

- [ ] **Step 1: Create CollectionList** — renders cards for each collection with name, program count, active badge, and activate/delete actions. Links to `/training/collections/[id]`.

- [ ] **Step 2: Create CollectionForm** — dialog/sheet with name + description fields. Submit POST to `/api/collections` or PUT to `/api/collections/[id]`.

- [ ] **Step 3: Commit**

```bash
git add features/programs/components/collection-list.tsx features/programs/components/collection-form.tsx
git commit -m "feat(programs): add CollectionList and CollectionForm components"
```

---

## Task 8: Build ProgramRoutineEditor and ScheduleOverrideModal

**Files:**
- Create: `features/programs/components/program-routine-editor.tsx`
- Create: `features/programs/components/schedule-override-modal.tsx`
- Create: `features/programs/components/program-list.tsx`

- [ ] **Step 1: Create ProgramList** — renders programs inside a collection with name, dates, active badge, CTA to view detail.

- [ ] **Step 2: Create ProgramRoutineEditor** — for a given Program, shows assigned routines with their recurrenceDays (using RecurrenceDayPicker), plus a "Add routine" selector (dropdown of user's routines). Uses `/api/program-routines`.

- [ ] **Step 3: Create ScheduleOverrideModal** — sheet/dialog triggered from calendar day. Three modes:
  - **CANCELLED**: select a date to cancel
  - **MOVED**: select original date → new date
  - **ADDED**: select a date + optional different routine

  Submits to `/api/schedule-override`.

- [ ] **Step 4: Verify compilation**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add features/programs/components/
git commit -m "feat(programs): add ProgramRoutineEditor, ScheduleOverrideModal, ProgramList"
```

---

## Task 9: Build Collection/Program pages

**Files:**
- Create: `app/(app)/training/collections/page.tsx`
- Create: `app/(app)/training/collections/[id]/page.tsx`
- Create: `app/(app)/training/programs/[id]/page.tsx`

- [ ] **Step 1: Create /training/collections page** — RSC, fetches collections via `PrismaProgramRepository`, renders CollectionList + "New Collection" button.

- [ ] **Step 2: Create /training/collections/[id] page** — RSC, fetches single collection, renders ProgramList + CollectionForm (edit) + "New Program" button.

- [ ] **Step 3: Create /training/programs/[id] page** — RSC, fetches program with routines, renders:
  - Program info (name, dates, RPE target)
  - ProgramRoutineEditor (list of assigned routines + recurrence)
  - Link to calendar to preview schedule

- [ ] **Step 4: Verify all pages compile and render**

```bash
npx tsc --noEmit
```

Open http://localhost:3000/training/collections, create a collection, add a program, assign routines, verify calendar reflects changes.

- [ ] **Step 5: Commit**

```bash
git add app/(app)/training/collections/ app/(app)/training/programs/
git commit -m "feat(pages): add Collections CRUD and Program detail pages"
```

---

## Task 10: Update training hub navigation

**Files:**
- Modify: `app/(app)/training/page.tsx`

- [ ] **Step 1: Add link to /training/collections** in the training hub page.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit
git add app/(app)/training/page.tsx
git commit -m "feat(nav): add Collections link to training hub"
```

---

## Plan C Complete

The user can now create Collections, Programs within them, assign Routines with recurrence patterns (MON–SUN), and create ScheduleOverrides (MOVED/CANCELLED/ADDED). All changes reflect immediately in the calendar views built in Plan B.

**Next: Plan D** — Refactor session execution to support multiple routines per day, SCHEDULED/AD_HOC source, and the new ExerciseLog model.
