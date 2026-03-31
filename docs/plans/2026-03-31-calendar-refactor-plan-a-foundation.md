# Calendar-First Refactor — Plan A: Foundation (Schema + Types + Seed)

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Work through them in order.

**Goal:** Reset the database to the new calendar-first schema, update all TypeScript types, and seed the database with representative data under the new model.

**Architecture:** Complete schema replacement — Collection→Program→ProgramRoutine→ScheduleOverride replaces the old Program→Phase→ProgramDay hierarchy. ExerciseFamily replaces the parent/variants tree. Pure Prisma migration with no data preservation (reset agreed).

**Tech Stack:** Prisma 7.5, PostgreSQL, TypeScript 5, tsx

---

## Scope Note

This plan (A) is the prerequisite for all other plans. It produces a working database + seed but no visible UI changes. Plans B–F depend on this being complete.

| Plan | Scope |
|---|---|
| **A (this)** | Schema reset, types, seed |
| B | CalendarService + `/today` + `/calendar` views + nav |
| C | CRUD Collections / Programs / ProgramRoutines / ScheduleOverride |
| D | Session execution refactor (`/training/session`) |
| E | ExerciseFamily + exercise catalog refactor |
| F | Progress: charts, adherence, streaks |

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Delete | `prisma/migrations/*/` | Wipe old migrations |
| Replace | `prisma/schema.prisma` | New schema |
| Replace | `types/index.ts` | Updated composite types |
| Replace | `prisma/seed.ts` | Seed with new model |
| Delete | `features/training/api/prisma-training-repository.ts` lines 57-101 | Uses old Program/Phase/ProgramDay — will be rebuilt in Plan B |

---

## Task 1: Wipe old migrations and reset DB

**Files:**
- Delete: `prisma/migrations/20260323160947_init/`
- Delete: `prisma/migrations/20260323162434_add_exercise_fields/`
- Delete: `prisma/migrations/20260323184750_expand_full_schema/`
- Delete: `prisma/migrations/20260326230309_add_auth_multiuser/`
- Delete: `prisma/migrations/20260327154459_routine_redesign/`

- [ ] **Step 1: Delete all migration folders**

```bash
rm -rf "prisma/migrations/20260323160947_init"
rm -rf "prisma/migrations/20260323162434_add_exercise_fields"
rm -rf "prisma/migrations/20260323184750_expand_full_schema"
rm -rf "prisma/migrations/20260326230309_add_auth_multiuser"
rm -rf "prisma/migrations/20260327154459_routine_redesign"
```

- [ ] **Step 2: Drop and recreate the dev database**

```bash
DATABASE_URL="postgresql://workout:workout@localhost:5432/workout_dev" \
  npx prisma db execute --stdin <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
SQL
```

Expected: no error, empty database.

- [ ] **Step 3: Verify migrations folder is clean**

```bash
ls prisma/migrations/
```

Expected: only `migration_lock.toml`

---

## Task 2: Write the new schema.prisma

**Files:**
- Replace: `prisma/schema.prisma`

- [ ] **Step 1: Replace the entire schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─── Auth ────────────────────────────────────────────────────────────────────

model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions     Session[]
  collections  Collection[]
  routines     Routine[]
  dailyLogs    DailyLog[]
  measurements BodyMeasurement[]

  @@map("user")
}

model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("session")
}

// ─── Exercise Catalog ─────────────────────────────────────────────────────────

model ExerciseFamily {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  createdAt   DateTime   @default(now())

  exercises Exercise[]

  @@map("exercise_family")
}

model Exercise {
  id          String  @id @default(cuid())
  name        String
  slug        String  @unique
  description String?
  imageUrl    String?
  videoUrl    String?

  muscleGroup  MuscleGroup
  movementType MovementType
  category     ExerciseCategory
  difficulty   Int              @default(1)

  // Family membership
  familyId    String?
  family      ExerciseFamily? @relation(fields: [familyId], references: [id])
  familyLevel Int?            // numeric Y-axis for progression chart
  familyRole  FamilyRole?     // MAIN_PATH | VARIANT

  // Default training params
  defaultSets        Int?
  defaultReps        Int?
  defaultDurationSec Int?
  defaultRestSec     Int     @default(60)
  defaultTempo       String?
  defaultRpe         Int?

  // Safety metadata
  jointStress       JointStress @default(LOW)
  targetJoints      String?
  contraindications String?
  safetyNotes       String?
  bodyweightPercent Float?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  routineExercises RoutineExercise[]
  exerciseLogs     ExerciseLog[]

  @@index([muscleGroup])
  @@index([category])
  @@index([familyId])
  @@map("exercise")
}

// ─── Routines (user-owned templates) ─────────────────────────────────────────

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

  exercises       RoutineExercise[]
  programRoutines ProgramRoutine[]
  dailyLogs       DailyLog[]

  @@index([userId])
  @@map("routine")
}

model RoutineExercise {
  id         String   @id @default(cuid())
  routineId  String
  routine    Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])

  order       Int
  block       String?
  sets        Int?
  reps        Int?
  durationSec Int?
  restSec     Int?
  tempo       String?
  rpe         Int?
  notes       String?

  createdAt DateTime @default(now())

  @@unique([routineId, order])
  @@index([routineId])
  @@map("routine_exercise")
}

// ─── Planning Hierarchy ───────────────────────────────────────────────────────

model Collection {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  isActive    Boolean  @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  programs Program[]

  @@index([userId])
  @@map("collection")
}

model Program {
  id           String     @id @default(cuid())
  collectionId String
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  name         String
  description  String?
  startDate    DateTime
  endDate      DateTime?
  isActive     Boolean    @default(false)
  rpeTarget    String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  programRoutines ProgramRoutine[]

  @@index([collectionId])
  @@map("program")
}

model ProgramRoutine {
  id             String   @id @default(cuid())
  programId      String
  program        Program  @relation(fields: [programId], references: [id], onDelete: Cascade)
  routineId      String
  routine        Routine  @relation(fields: [routineId], references: [id])
  recurrenceDays String[] // ["MON","WED","FRI"]
  startDate      DateTime?
  endDate        DateTime?

  createdAt DateTime @default(now())

  overrides ScheduleOverride[]

  @@index([programId])
  @@index([routineId])
  @@map("program_routine")
}

model ScheduleOverride {
  id               String               @id @default(cuid())
  programRoutineId String
  programRoutine   ProgramRoutine       @relation(fields: [programRoutineId], references: [id], onDelete: Cascade)
  type             ScheduleOverrideType
  originalDate     DateTime?
  newDate          DateTime?
  routineId        String?              // override routine (if different)
  notes            String?

  createdAt DateTime @default(now())

  @@index([programRoutineId])
  @@map("schedule_override")
}

// ─── Daily Execution ──────────────────────────────────────────────────────────

model DailyLog {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime
  routineId String?
  routine   Routine?      @relation(fields: [routineId], references: [id])
  source    SessionSource @default(SCHEDULED)

  status      CompletionStatus @default(PENDING)
  startedAt   DateTime?
  finishedAt  DateTime?
  durationMin Int?

  overallRpe   Int?
  energyLevel  Int?
  sleepHours   Float?
  sleepQuality Int?
  bodyWeight   Float?
  mood         Int?

  painLevel Int?
  painNotes String?
  notes     String?

  watchHrAvg         Int?
  watchHrMax         Int?
  watchCalories      Int?
  watchActiveMinutes Int?
  watchSpO2          Int?
  watchStressScore   Int?
  watchHrZones       String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  exerciseLogs ExerciseLog[]

  @@unique([userId, date, routineId])
  @@index([userId])
  @@index([date])
  @@index([status])
  @@map("daily_log")
}

model ExerciseLog {
  id         String   @id @default(cuid())
  dailyLogId String
  dailyLog   DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise   Exercise @relation(fields: [exerciseId], references: [id])

  completed     Boolean @default(false)
  setsCompleted Int?
  repsPerSet    String?
  durationSec   Int?
  holdTimeSec   String?

  rpeActual   Int?
  formQuality FormQuality?
  painDuring  Int?

  usedRegression Boolean @default(false)
  regressionNote String?
  notes          String?

  createdAt DateTime @default(now())

  @@index([dailyLogId])
  @@index([exerciseId])
  @@index([createdAt])
  @@map("exercise_log")
}

// ─── Body Measurements ────────────────────────────────────────────────────────

model BodyMeasurement {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date     DateTime
  weight   Float?
  waistCm  Float?
  hipCm    Float?
  chestCm  Float?
  armCm    Float?
  thighCm  Float?
  notes    String?
  photoUrl String?

  createdAt DateTime @default(now())

  @@index([date])
  @@map("body_measurement")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum MuscleGroup {
  CHEST
  BACK
  LEGS
  SHOULDERS
  CORE
  MOBILITY
  FULL_BODY
}

enum MovementType {
  PUSH
  PULL
  SQUAT
  HINGE
  CARRY
  ISOMETRIC
  MOBILITY
  ACTIVATION
}

enum ExerciseCategory {
  STANDARD
  REGRESSION
  PROGRESSION
  PREHAB
  WARMUP
  COOLDOWN
}

enum JointStress {
  NONE
  LOW
  MODERATE
  HIGH
}

enum SessionType {
  TRAINING
  MOBILITY
  REST
  DELOAD
}

enum CompletionStatus {
  PENDING
  COMPLETED
  PARTIAL
  SKIPPED
}

enum FormQuality {
  PERFECT
  GOOD
  FAIR
  POOR
}

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

- [ ] **Step 2: Run the migration**

```bash
DATABASE_URL="postgresql://workout:workout@localhost:5432/workout_dev" \
  npx prisma migrate dev --name init
```

Expected output ends with: `Your database is now in sync with your schema.`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` (no type errors).

- [ ] **Step 4: Commit the schema**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): replace schema with calendar-first model"
```

---

## Task 3: Update types/index.ts

**Files:**
- Replace: `types/index.ts`

- [ ] **Step 1: Replace the entire file**

```typescript
import type {
  Exercise,
  ExerciseFamily,
  Collection,
  Program,
  ProgramRoutine,
  ScheduleOverride,
  Routine,
  RoutineExercise,
  DailyLog,
  ExerciseLog,
  BodyMeasurement,
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
  CompletionStatus,
  FormQuality,
  FamilyRole,
  ScheduleOverrideType,
  SessionSource,
} from "@prisma/client"

// ─── Re-export Prisma enums ───────────────────────────────────────────────────

export type {
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
  CompletionStatus,
  FormQuality,
  FamilyRole,
  ScheduleOverrideType,
  SessionSource,
}

// ─── Re-export model types ────────────────────────────────────────────────────

export type {
  Exercise,
  ExerciseFamily,
  Collection,
  Program,
  ProgramRoutine,
  ScheduleOverride,
  Routine,
  RoutineExercise,
  DailyLog,
  ExerciseLog,
  BodyMeasurement,
}

// ─── Exercise with family ─────────────────────────────────────────────────────

export interface ExerciseWithFamily extends Exercise {
  family: ExerciseFamily | null
}

export interface ExerciseWithLogs extends Exercise {
  exerciseLogs: ExerciseLog[]
}

// ─── Routine with exercises ───────────────────────────────────────────────────

export interface RoutineExerciseWithDetails extends RoutineExercise {
  exercise: Exercise
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExerciseWithDetails[]
}

// ─── ProgramRoutine with routine and overrides ────────────────────────────────

export interface ProgramRoutineWithDetails extends ProgramRoutine {
  routine: RoutineWithExercises
  overrides: ScheduleOverride[]
}

// ─── Program with routines ────────────────────────────────────────────────────

export interface ProgramWithRoutines extends Program {
  programRoutines: ProgramRoutineWithDetails[]
}

// ─── Collection with programs ─────────────────────────────────────────────────

export interface CollectionWithPrograms extends Collection {
  programs: Program[]
}

// ─── DailyLog with exercises ──────────────────────────────────────────────────

export interface ExerciseLogWithExercise extends ExerciseLog {
  exercise: Exercise
}

export interface DailyLogWithExercises extends DailyLog {
  routine: Routine | null
  exerciseLogs: ExerciseLogWithExercise[]
}

// ─── /today response ─────────────────────────────────────────────────────────

export interface TodayRoutineEntry {
  routineId: string
  programRoutineId: string
  source: "PATTERN" | "OVERRIDE_ADDED" | "OVERRIDE_MOVED"
  routine: RoutineWithExercises
}

export interface TodayResponse {
  entries: TodayRoutineEntry[]
  dailyLogs: DailyLogWithExercises[]
  isRestDay: boolean
}

// ─── Exercise block (UI grouping) ─────────────────────────────────────────────

export interface ExerciseBlock {
  name: string
  exercises: RoutineExerciseWithDetails[]
}

// ─── Reps parsed ─────────────────────────────────────────────────────────────

export type RepsPerSet = number[]
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: errors only in files that still import old types (Phase, ProgramDay, ExerciseWithVariants). Note which files fail — they will be fixed in Plans B–F.

- [ ] **Step 3: Commit types**

```bash
git add types/index.ts
git commit -m "feat(types): update composite types for calendar-first schema"
```

---

## Task 4: Fix broken imports from old types

**Files:**
- Modify: `features/session/api/session-repository.ts`
- Modify: `features/programs/api/program-repository.ts`
- Modify: `features/programs/api/prisma-program-repository.ts`
- Modify: `features/session/api/prisma-session-repository.ts`
- Modify: `features/training/api/prisma-training-repository.ts`
- Modify: `features/training/types/training.types.ts`
- Modify: `features/programs/components/plan-phase-grid.tsx`
- Modify: `features/programs/components/day-drawer.tsx`
- Modify: `features/session/components/today-session.tsx`
- Modify: `app/(app)/today/page.tsx`
- Modify: `app/(app)/training/plan/page.tsx`

These files import `Phase`, `ProgramDay`, `ExerciseWithVariants`, `ExerciseOverride`, or `ProgramWithPhases`. The strategy is: **stub them out** so the app compiles. Full rewrites happen in Plans B–F.

- [ ] **Step 1: Stub features/session/api/session-repository.ts**

Read the file first, then replace its content with a minimal interface that matches the new types:

```typescript
// features/session/api/session-repository.ts
import type { DailyLog, ExerciseLog } from "@prisma/client"
import type { TodayResponse, DailyLogWithExercises } from "@/types"

export interface UpsertDailyLogInput {
  routineId?: string | null
  source?: "SCHEDULED" | "AD_HOC"
  status?: string
  startedAt?: string
  finishedAt?: string
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
  watchHrAvg?: number
  watchHrMax?: number
  watchCalories?: number
  watchActiveMinutes?: number
  watchSpO2?: number
  watchStressScore?: number
  watchHrZones?: number[]
}

export interface UpsertExerciseLogInput {
  dailyLogId: string
  exerciseId: string
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export interface UpdateExerciseLogInput {
  completed?: boolean
  setsCompleted?: number
  repsPerSet?: number[]
  durationSec?: number
  rpeActual?: number
  painDuring?: number
  notes?: string
}

export interface SessionRepository {
  getTodayData(userId: string): Promise<TodayResponse>
  getTodayLog(userId: string): Promise<DailyLogWithExercises | null>
  upsertTodayLog(userId: string, input: UpsertDailyLogInput): Promise<DailyLog>
  upsertExerciseLog(input: UpsertExerciseLogInput): Promise<ExerciseLog>
  updateExerciseLog(id: string, input: UpdateExerciseLogInput): Promise<ExerciseLog>
}
```

- [ ] **Step 2: Stub features/session/api/prisma-session-repository.ts**

Replace the file with a stub that compiles but returns empty data (temporary until Plan B):

```typescript
// features/session/api/prisma-session-repository.ts
import { prisma } from "@/lib/prisma"
import type { DailyLog, ExerciseLog, CompletionStatus } from "@prisma/client"
import type { TodayResponse, DailyLogWithExercises } from "@/types"
import type {
  SessionRepository,
  UpsertDailyLogInput,
  UpsertExerciseLogInput,
  UpdateExerciseLogInput,
} from "./session-repository"
import { parseRepsPerSet, serializeRepsPerSet } from "@/features/session/services/session.service"

function getTodayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export class PrismaSessionRepository implements SessionRepository {
  async getTodayData(userId: string): Promise<TodayResponse> {
    const dailyLogs = await this.getTodayLogs(userId)
    // TODO(Plan B): wire CalendarService here
    return { entries: [], dailyLogs, isRestDay: true }
  }

  async getTodayLog(userId: string): Promise<DailyLogWithExercises | null> {
    const logs = await this.getTodayLogs(userId)
    return logs[0] ?? null
  }

  private async getTodayLogs(userId: string): Promise<DailyLogWithExercises[]> {
    const { start, end } = getTodayRange()
    return prisma.dailyLog.findMany({
      where: { userId, date: { gte: start, lte: end } },
      include: {
        routine: true,
        exerciseLogs: {
          include: { exercise: true },
          orderBy: { createdAt: "asc" },
        },
      },
    })
  }

  async upsertTodayLog(userId: string, input: UpsertDailyLogInput): Promise<DailyLog> {
    const { start, end } = getTodayRange()
    const existing = await prisma.dailyLog.findFirst({
      where: { userId, date: { gte: start, lte: end }, routineId: input.routineId ?? null },
    })

    const data = {
      routineId: input.routineId ?? null,
      source: (input.source ?? "SCHEDULED") as "SCHEDULED" | "AD_HOC",
      status: (input.status ?? "PENDING") as CompletionStatus,
      startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
      finishedAt: input.finishedAt ? new Date(input.finishedAt) : undefined,
      durationMin: input.durationMin ?? undefined,
      overallRpe: input.overallRpe ?? undefined,
      energyLevel: input.energyLevel ?? undefined,
      sleepHours: input.sleepHours ?? undefined,
      sleepQuality: input.sleepQuality ?? undefined,
      mood: input.mood ?? undefined,
      bodyWeight: input.bodyWeight ?? undefined,
      painLevel: input.painLevel ?? undefined,
      painNotes: input.painNotes ?? undefined,
      notes: input.notes ?? undefined,
      watchHrAvg: input.watchHrAvg ?? undefined,
      watchHrMax: input.watchHrMax ?? undefined,
      watchCalories: input.watchCalories ?? undefined,
      watchActiveMinutes: input.watchActiveMinutes ?? undefined,
      watchSpO2: input.watchSpO2 ?? undefined,
      watchStressScore: input.watchStressScore ?? undefined,
      watchHrZones: input.watchHrZones ? JSON.stringify(input.watchHrZones) : undefined,
    }

    if (existing) {
      return prisma.dailyLog.update({ where: { id: existing.id }, data })
    }

    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return prisma.dailyLog.create({ data: { userId, date, ...data } })
  }

  async upsertExerciseLog(input: UpsertExerciseLogInput): Promise<ExerciseLog> {
    const existing = await prisma.exerciseLog.findFirst({
      where: { dailyLogId: input.dailyLogId, exerciseId: input.exerciseId },
    })

    const data = {
      completed: true,
      setsCompleted: input.setsCompleted ?? undefined,
      repsPerSet: Array.isArray(input.repsPerSet) ? serializeRepsPerSet(input.repsPerSet) : undefined,
      durationSec: input.durationSec ?? undefined,
      rpeActual: input.rpeActual ?? undefined,
      painDuring: input.painDuring ?? undefined,
      notes: input.notes ?? undefined,
    }

    if (existing) {
      return prisma.exerciseLog.update({ where: { id: existing.id }, data })
    }

    return prisma.exerciseLog.create({
      data: { dailyLogId: input.dailyLogId, exerciseId: input.exerciseId, ...data },
    })
  }

  async updateExerciseLog(id: string, input: UpdateExerciseLogInput): Promise<ExerciseLog> {
    return prisma.exerciseLog.update({
      where: { id },
      data: {
        completed: input.completed ?? true,
        setsCompleted: input.setsCompleted ?? undefined,
        repsPerSet: Array.isArray(input.repsPerSet) ? serializeRepsPerSet(input.repsPerSet) : undefined,
        durationSec: input.durationSec ?? undefined,
        rpeActual: input.rpeActual ?? undefined,
        painDuring: input.painDuring ?? undefined,
        notes: input.notes ?? undefined,
      },
    })
  }
}
```

- [ ] **Step 3: Stub features/programs/api/program-repository.ts**

```typescript
// features/programs/api/program-repository.ts
import type { Collection, Program, ProgramRoutine } from "@prisma/client"
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"

export interface ProgramRepository {
  getActiveProgram(userId: string): Promise<ProgramWithRoutines | null>
  getCollections(userId: string): Promise<CollectionWithPrograms[]>
  getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null>
  getProgram(id: string): Promise<ProgramWithRoutines | null>
}
```

- [ ] **Step 4: Stub features/programs/api/prisma-program-repository.ts**

```typescript
// features/programs/api/prisma-program-repository.ts
import { prisma } from "@/lib/prisma"
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"
import type { ProgramRepository } from "./program-repository"

export class PrismaProgramRepository implements ProgramRepository {
  async getActiveProgram(userId: string): Promise<ProgramWithRoutines | null> {
    const collection = await prisma.collection.findFirst({
      where: { userId, isActive: true },
      include: { programs: { where: { isActive: true }, take: 1 } },
    })
    if (!collection?.programs[0]) return null
    return this.getProgram(collection.programs[0].id)
  }

  async getCollections(userId: string): Promise<CollectionWithPrograms[]> {
    return prisma.collection.findMany({
      where: { userId },
      include: { programs: true },
      orderBy: { createdAt: "desc" },
    })
  }

  async getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null> {
    return prisma.collection.findFirst({
      where: { id, userId },
      include: { programs: true },
    })
  }

  async getProgram(id: string): Promise<ProgramWithRoutines | null> {
    return prisma.program.findUnique({
      where: { id },
      include: {
        programRoutines: {
          include: {
            routine: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: "asc" },
                },
              },
            },
            overrides: true,
          },
        },
      },
    })
  }
}
```

- [ ] **Step 5: Stub training-repository to remove old Program/Phase references**

```typescript
// features/training/api/training-repository.ts
export interface TrainingRepository {
  getWeekData(date: Date, userId: string): Promise<WeekData>
  getMonthData(year: number, month: number, userId: string): Promise<MonthData>
  getYearData(year: number, userId: string): Promise<YearData>
}

export interface WeekData {
  weekNumber: number
  year: number
  month: string
  days: WeekDay[]
}

export interface WeekDay {
  date: string
  dayOfWeek: number
  isToday: boolean
  isRest: boolean
  routines: ScheduledRoutinePreview[]
  dailyLogs: DayLogPreview[]
}

export interface ScheduledRoutinePreview {
  routineId: string
  name: string
  exerciseCount: number
  estimatedDuration: number | null
  sessionType: string
}

export interface DayLogPreview {
  routineId: string | null
  status: string
  rpeActual: number | null
  durationMin: number | null
  exercisesCompleted: number
}

export interface MonthData {
  days: MonthDay[]
  currentStreak: number
  adherence: number
  completedDays: number
  totalPastDays: number
}

export interface MonthDay {
  date: string
  status: DayStatus
  routineNames: string[]
}

export interface YearData {
  days: YearDay[]
  summary: { totalSessions: number; currentStreak: number; maxStreak: number }
}

export interface YearDay {
  date: string
  status: DayStatus
}

export type DayStatus = "REST" | "PENDING" | "COMPLETED" | "PARTIAL" | "SKIPPED"
```

- [ ] **Step 6: Stub prisma-training-repository.ts with new types**

```typescript
// features/training/api/prisma-training-repository.ts
import { prisma } from "@/lib/prisma"
import { calculateStreak } from "../utils/training-grid"
import type {
  TrainingRepository,
  WeekData,
  WeekDay,
  MonthData,
  MonthDay,
  YearData,
  YearDay,
  DayStatus,
  ScheduledRoutinePreview,
} from "./training-repository"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
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

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function jsDayToWeekIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

// ─── NOTE ─────────────────────────────────────────────────────────────────────
// This stub returns daily logs only (no scheduled routines from CalendarService).
// CalendarService integration happens in Plan B.

export class PrismaTrainingRepository implements TrainingRepository {
  async getWeekData(date: Date, userId: string): Promise<WeekData> {
    const monday = getMondayOfWeek(date)
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: monday, lte: sunday } },
      include: { routine: true, _count: { select: { exerciseLogs: true } } },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const days: WeekDay[] = []

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday)
      dayDate.setDate(monday.getDate() + i)
      const dateStr = toDateString(dayDate)
      const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

      days.push({
        date: dateStr,
        dayOfWeek: jsDayToWeekIndex(dayDate.getDay()),
        isToday: dateStr === todayStr,
        isRest: logsForDay.length === 0,
        routines: [], // TODO(Plan B): CalendarService
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

  async getMonthData(year: number, month: number, userId: string): Promise<MonthData> {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0, 23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: firstDay, lte: lastDay } },
      include: { routine: true },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const daysInMonth = lastDay.getDate()
    const days: MonthDay[] = []

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d)
      const dateStr = toDateString(dayDate)
      const logsForDay = dailyLogs.filter((l) => toDateString(l.date) === dateStr)

      const status: DayStatus =
        logsForDay.length === 0
          ? "REST"
          : (logsForDay[0].status as DayStatus)

      days.push({
        date: dateStr,
        status,
        routineNames: logsForDay.map((l) => l.routine?.name ?? "Sesión libre"),
      })
    }

    const pastDays = days.filter((d) => d.date <= todayStr)
    const completedDays = pastDays.filter((d) => d.status === "COMPLETED").length
    const { current: currentStreak } = calculateStreak(
      days.map((d) => ({ date: d.date, status: d.status, isRest: d.status === "REST" }))
    )

    return {
      days,
      currentStreak,
      adherence:
        pastDays.length > 0 ? Math.round((completedDays / pastDays.length) * 100) : 0,
      completedDays,
      totalPastDays: pastDays.length,
    }
  }

  async getYearData(year: number, userId: string): Promise<YearData> {
    const firstDay = new Date(year, 0, 1)
    const lastDay = new Date(year, 11, 31, 23, 59, 59, 999)

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId, date: { gte: firstDay, lte: lastDay } },
      select: { date: true, status: true },
      orderBy: { date: "asc" },
    })

    const todayStr = toDateString(new Date())
    const daysInYear = isLeapYear(year) ? 366 : 365
    const days: YearDay[] = []

    for (let d = 0; d < daysInYear; d++) {
      const dayDate = new Date(year, 0, d + 1)
      const dateStr = toDateString(dayDate)
      const log = dailyLogs.find((l) => toDateString(l.date) === dateStr)
      days.push({ date: dateStr, status: (log?.status ?? "REST") as DayStatus })
    }

    const totalSessions = days.filter(
      (d) => d.status === "COMPLETED" && d.date <= todayStr
    ).length
    const { current: currentStreak, max: maxStreak } = calculateStreak(
      days.map((d) => ({ date: d.date, status: d.status, isRest: d.status === "REST" }))
    )

    return { days, summary: { totalSessions, currentStreak, maxStreak } }
  }
}
```

- [ ] **Step 7: Fix any remaining import errors by removing stale references**

Run tsc and fix each error:

```bash
npx tsc --noEmit 2>&1 | head -60
```

For any file importing `Phase`, `ProgramDay`, `ExerciseWithVariants`, `ExerciseOverride`, or `ProgramWithPhases`: remove the import and replace with a `// TODO(Plan X)` comment on the relevant usage. The goal is zero type errors at compile time.

- [ ] **Step 8: Commit fixes**

```bash
git add features/ app/ types/
git commit -m "fix(types): stub out old model references after schema reset"
```

---

## Task 5: Rewrite prisma/seed.ts

**Files:**
- Replace: `prisma/seed.ts`

- [ ] **Step 1: Replace seed with new model data**

```typescript
import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ─── User ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("workout123", 10)
  const user = await prisma.user.upsert({
    where: { email: "demo@workout.app" },
    update: {},
    create: { name: "Demo User", email: "demo@workout.app", password },
  })
  console.log("✓ User created:", user.email)

  // ─── Exercise Families ──────────────────────────────────────────────────────
  const familyFlexiones = await prisma.exerciseFamily.upsert({
    where: { slug: "flexiones" },
    update: {},
    create: { name: "Flexiones", slug: "flexiones", description: "Empuje horizontal de suelo" },
  })

  const familySentadilla = await prisma.exerciseFamily.upsert({
    where: { slug: "sentadilla" },
    update: {},
    create: { name: "Sentadilla", slug: "sentadilla", description: "Patrón de sentadilla" },
  })

  const familyPlancha = await prisma.exerciseFamily.upsert({
    where: { slug: "plancha" },
    update: {},
    create: { name: "Plancha", slug: "plancha", description: "Isométrico de core" },
  })

  console.log("✓ Exercise families created")

  // ─── Exercises ─────────────────────────────────────────────────────────────
  const exFlexionRodillas = await prisma.exercise.upsert({
    where: { slug: "flexion-rodillas" },
    update: {},
    create: {
      name: "Flexión de rodillas",
      slug: "flexion-rodillas",
      description: "Flexión con apoyo en rodillas. Ideal para construir base de fuerza.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "REGRESSION",
      difficulty: 1,
      familyId: familyFlexiones.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSec: 60,
      defaultTempo: "2-1-2-0",
      defaultRpe: 6,
      jointStress: "LOW",
      safetyNotes: "Mantener columna neutra.",
    },
  })

  const exFlexionEstandar = await prisma.exercise.upsert({
    where: { slug: "flexion-estandar" },
    update: {},
    create: {
      name: "Flexión estándar",
      slug: "flexion-estandar",
      description: "Flexión completa de suelo. Patrón base.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "STANDARD",
      difficulty: 3,
      familyId: familyFlexiones.id,
      familyLevel: 2,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 7,
      jointStress: "LOW",
      safetyNotes: "Codos a 45°, no flectados ni perpendiculares.",
    },
  })

  const exFlexionDeclinada = await prisma.exercise.upsert({
    where: { slug: "flexion-declinada" },
    update: {},
    create: {
      name: "Flexión declinada",
      slug: "flexion-declinada",
      description: "Pies elevados, mayor activación de pectoral superior.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "PROGRESSION",
      difficulty: 5,
      familyId: familyFlexiones.id,
      familyLevel: 3,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 8,
      jointStress: "MODERATE",
    },
  })

  const exFlexionDiamante = await prisma.exercise.upsert({
    where: { slug: "flexion-diamante" },
    update: {},
    create: {
      name: "Flexión diamante",
      slug: "flexion-diamante",
      description: "Variante con manos juntas. Mayor énfasis en tríceps.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "STANDARD",
      difficulty: 4,
      familyId: familyFlexiones.id,
      familyLevel: 2,
      familyRole: "VARIANT",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      jointStress: "LOW",
    },
  })

  const exSentadillaAsistida = await prisma.exercise.upsert({
    where: { slug: "sentadilla-asistida" },
    update: {},
    create: {
      name: "Sentadilla asistida",
      slug: "sentadilla-asistida",
      description: "Sentadilla con apoyo en silla o TRX. Progresión inicial.",
      muscleGroup: "LEGS",
      movementType: "SQUAT",
      category: "REGRESSION",
      difficulty: 1,
      familyId: familySentadilla.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSec: 60,
      defaultRpe: 6,
      jointStress: "LOW",
    },
  })

  const exSentadillaEstandar = await prisma.exercise.upsert({
    where: { slug: "sentadilla-estandar" },
    update: {},
    create: {
      name: "Sentadilla estándar",
      slug: "sentadilla-estandar",
      description: "Sentadilla libre con peso corporal.",
      muscleGroup: "LEGS",
      movementType: "SQUAT",
      category: "STANDARD",
      difficulty: 3,
      familyId: familySentadilla.id,
      familyLevel: 2,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 12,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 7,
      jointStress: "MODERATE",
      targetJoints: "Rodillas, caderas",
    },
  })

  const exPlanchaEstandar = await prisma.exercise.upsert({
    where: { slug: "plancha-estandar" },
    update: {},
    create: {
      name: "Plancha estándar",
      slug: "plancha-estandar",
      description: "Isométrico de core en posición de flexión.",
      muscleGroup: "CORE",
      movementType: "ISOMETRIC",
      category: "STANDARD",
      difficulty: 2,
      familyId: familyPlancha.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultDurationSec: 30,
      defaultRestSec: 60,
      defaultRpe: 6,
      jointStress: "NONE",
    },
  })

  const exCatCow = await prisma.exercise.upsert({
    where: { slug: "cat-cow" },
    update: {},
    create: {
      name: "Cat-Cow",
      slug: "cat-cow",
      description: "En cuadrupedia, alternar flexión/extensión de columna. 3s retención.",
      muscleGroup: "MOBILITY",
      movementType: "MOBILITY",
      category: "PREHAB",
      difficulty: 1,
      defaultSets: 1,
      defaultReps: 12,
      defaultRestSec: 30,
      jointStress: "NONE",
      safetyNotes: "Movimiento lento y controlado.",
    },
  })

  const exGluteoBridge = await prisma.exercise.upsert({
    where: { slug: "gluteo-bridge" },
    update: {},
    create: {
      name: "Glúteo Bridge",
      slug: "gluteo-bridge",
      description: "Puente de glúteos. Activación posterior.",
      muscleGroup: "LEGS",
      movementType: "HINGE",
      category: "ACTIVATION",
      difficulty: 1,
      defaultSets: 3,
      defaultReps: 15,
      defaultRestSec: 45,
      jointStress: "NONE",
    },
  })

  console.log("✓ Exercises created")

  // ─── Routines ──────────────────────────────────────────────────────────────
  const routineFullBody = await prisma.routine.create({
    data: {
      userId: user.id,
      name: "Full Body A",
      description: "Sesión de fuerza full body. Fase Cero.",
      sessionType: "TRAINING",
      durationMin: 45,
      exercises: {
        create: [
          { order: 1, exerciseId: exCatCow.id, sets: 1, reps: 12, block: "Calentamiento" },
          { order: 2, exerciseId: exGluteoBridge.id, sets: 2, reps: 15, block: "Activación" },
          { order: 3, exerciseId: exFlexionRodillas.id, sets: 3, reps: 10, restSec: 60, rpe: 6, block: "Principal" },
          { order: 4, exerciseId: exSentadillaAsistida.id, sets: 3, reps: 10, restSec: 60, rpe: 6, block: "Principal" },
          { order: 5, exerciseId: exPlanchaEstandar.id, sets: 3, durationSec: 20, restSec: 60, block: "Core" },
        ],
      },
    },
  })

  const routineMovilidad = await prisma.routine.create({
    data: {
      userId: user.id,
      name: "Movilidad Diaria",
      description: "Rutina de movilidad y activación. Todos los días.",
      sessionType: "MOBILITY",
      durationMin: 20,
      exercises: {
        create: [
          { order: 1, exerciseId: exCatCow.id, sets: 2, reps: 10 },
          { order: 2, exerciseId: exGluteoBridge.id, sets: 2, reps: 15 },
        ],
      },
    },
  })

  console.log("✓ Routines created")

  // ─── Collection + Program + ProgramRoutines ────────────────────────────────
  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "Integridad Estructural",
      description: "Programa de construcción de base. Fases cero a dos.",
      isActive: true,
    },
  })

  const program = await prisma.program.create({
    data: {
      collectionId: collection.id,
      name: "Fase Cero",
      description: "Baja carga articular, movilidad y activación. 6 semanas.",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-05-12"),
      isActive: true,
      rpeTarget: "6-7",
    },
  })

  await prisma.programRoutine.create({
    data: {
      programId: program.id,
      routineId: routineFullBody.id,
      recurrenceDays: ["MON", "WED", "FRI"],
    },
  })

  await prisma.programRoutine.create({
    data: {
      programId: program.id,
      routineId: routineMovilidad.id,
      recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
  })

  console.log("✓ Collection, Program, and ProgramRoutines created")
  console.log("🎉 Seed complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Run the seed**

```bash
DATABASE_URL="postgresql://workout:workout@localhost:5432/workout_dev" \
  npx prisma db seed
```

Expected output:
```
🌱 Seeding database...
✓ User created: demo@workout.app
✓ Exercise families created
✓ Exercises created
✓ Routines created
✓ Collection, Program, and ProgramRoutines created
🎉 Seed complete!
```

- [ ] **Step 3: Verify data in Prisma Studio**

```bash
DATABASE_URL="postgresql://workout:workout@localhost:5432/workout_dev" \
  npx prisma studio
```

Open in browser. Verify:
- `exercise_family`: 3 rows (Flexiones, Sentadilla, Plancha)
- `exercise`: 8 rows with correct familyId, familyLevel, familyRole
- `collection`: 1 row (isActive: true)
- `program`: 1 row (isActive: true, startDate: 2026-04-01)
- `program_routine`: 2 rows with correct recurrenceDays arrays
- `routine`: 2 rows

- [ ] **Step 4: Commit seed**

```bash
git add prisma/seed.ts
git commit -m "feat(seed): add calendar-first seed data with families, program, and routines"
```

---

## Task 6: Verify the app boots

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

Expected: server starts at http://localhost:3000 with no compilation errors. The `/today` page will show an empty state (no entries) because CalendarService is not yet wired — that's correct at this stage.

- [ ] **Step 2: Verify login works**

Open http://localhost:3000/login. Log in with `demo@workout.app` / `workout123`. Expected: redirect to `/today`.

- [ ] **Step 3: Commit Plan A complete marker**

```bash
git add -A
git commit -m "feat: Plan A complete — schema reset, types, seed, app boots"
```

---

## Plan A Complete

The database is reset, all types are updated, the seed populates realistic data, and the app compiles and boots. Proceed to **Plan B: Calendar Infrastructure**.
