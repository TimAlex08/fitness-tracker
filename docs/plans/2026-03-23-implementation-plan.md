# Workout App — Implementation Plan
**Date:** 2026-03-23
**Design doc:** `docs/plans/2026-03-23-workout-app-design.md`

---

## Sprint 1 — Schema + Seed + /today (structured mode)

### 1.1 Migrate Prisma schema
- Replace current schema with full schema from design doc
- Add models: Program, Phase, Routine, RoutineExercise, BodyMeasurement
- Expand Exercise: movementType, difficulty, parentId, bodyweightPercent, videoUrl, contraindications, targetJoints
- Expand DailyLog: isFreeSession, startedAt, finishedAt, durationMin, sleepQuality, mood, painLevel, painNotes, bodyWeight, watch fields (watchHrAvg, watchHrMax, watchCalories, watchActiveMinutes, watchSpO2, watchStressScore, watchHrZones)
- Expand ExerciseLog: painDuring (drop formQuality, usedRegression)
- Run `npx prisma migrate dev --name expand-full-schema`

### 1.2 Update seed with full Fase Cero data
- Update `prisma/seed.ts` with all exercises from plan_inicial.md
- Seed one active Program → Phase 0 → Routine "Full Body A" (Mon/Wed/Fri) + "Movilidad Diaria"
- Assign exercises to routines with correct order, block, sets/reps/tempo
- Run `npx prisma db seed`

### 1.3 API: GET /api/daily-log/today
- Detect today's day of week
- Find active Program → current Phase → matching Routine
- Return routine with exercises (ordered by block + order)
- If no routine matches → return `{ isFreeDay: true }`

### 1.4 API: POST /api/daily-log
- Create or upsert DailyLog for today
- Accept: routineId, status, all biometric fields, all watch fields

### 1.5 API: POST /api/exercise-log + PUT /api/exercise-log/[id]
- Create ExerciseLog linked to DailyLog
- Fields: exerciseId, setsCompleted, repsPerSet (JSON), rpeActual, painDuring, notes, completed

### 1.6 Page: /today (structured mode only)
- Fetch today's routine via `/api/daily-log/today`
- Show session header: date, routine name, estimated duration
- Exercise checklist: grouped by block (warmup / main / cooldown)
- Per exercise card:
  - Name, target sets×reps, tempo, target RPE
  - Input for each set: reps done + RPE
  - Pain slider (0-5)
  - Optional notes
  - "Complete exercise" button
- Rest timer component: countdown after each set
- "Finish session" button → post-session form (watch data + biometrics)

---

## Sprint 2 — /today free mode + components polish

### 2.1 Free session mode
- "Start free session" button on /today when no routine assigned (or always accessible)
- Exercise search/picker component (search by name, filter by muscle group)
- Add exercises to session dynamically
- Same logging per exercise as structured mode

### 2.2 Post-session form
- Trigger on "Finish session"
- Fields: overall RPE, energy level, sleep hours, sleep quality, mood, body weight
- Watch data section: HR avg/max, calories, active minutes, SpO2, stress, HR zones
- All fields optional, submit updates DailyLog

### 2.3 Components
- `<SetTracker />` — per-set input (reps, RPE)
- `<RestTimer />` — countdown timer, configurable duration
- `<RpeSlider />` — 1-10 RPE selector
- `<PainIndicator />` — 0-5 pain selector
- `<PostSessionForm />` — biometrics + watch data

---

## Sprint 3 — Exercise catalog CRUD

### 3.1 API: /api/exercises
- GET with filters: muscleGroup, movementType, category, search query
- POST: create exercise (all fields)
- GET /api/exercises/[id]: detail + exercise history (last 10 ExerciseLogs)
- PUT /api/exercises/[id]: update
- DELETE /api/exercises/[id]: soft delete or hard delete

### 3.2 Page: /exercises
- Grid layout, 3 cols on desktop
- Filter bar: muscle group chips, movement type, category
- Search input
- Exercise card: name, category badge, difficulty indicator, muscle group
- "New exercise" button → form modal/drawer

### 3.3 Page: /exercises/[id]
- Exercise detail: description, safety notes, contraindications
- Video embed if videoUrl set
- Variants tree: regressions ↑ standard ↓ progressions
- Performance chart: reps and RPE over last 8 sessions

### 3.4 Exercise form (create/edit)
- shadcn/ui Sheet or Dialog
- All fields with appropriate inputs
- Parent exercise picker for hierarchy

---

## Sprint 4 — Program management

### 4.1 API: /api/program
- GET: active program with all phases, routines, routine exercises
- POST /api/program/routines: create routine in a phase
- PUT /api/program/routines/[id]: update routine
- DELETE /api/program/routines/[id]
- POST /api/program/routines/[id]/exercises: add exercise to routine
- PUT /api/program/routines/[id]/exercises/[exerciseId]: update params
- DELETE /api/program/routines/[id]/exercises/[exerciseId]

### 4.2 Page: /program
- Active program header with name and description
- Phase tabs or accordion
- Each phase: name, week range, RPE target, benchmarks
- Each routine: name, day of week, session type, exercise list
- Drag-to-reorder exercises within routine (or up/down buttons)
- Inline edit for sets/reps/tempo/rest per exercise
- "Add exercise to routine" button → exercise picker

---

## Sprint 5 — Log history + Progress

### 5.1 API: /api/log
- GET /api/log?from=date&to=date: all DailyLogs with exercise count
- GET /api/log/[date]: full DailyLog with all ExerciseLogs

### 5.2 Page: /log
- Calendar grid (current month)
- Color coded: green=COMPLETED, yellow=PARTIAL, red=SKIPPED, gray=PENDING
- Click day → /log/[date]

### 5.3 Page: /log/[date]
- Read-only session summary
- List of exercises with reps, RPE, pain
- Watch data summary
- Biometric snapshot

### 5.4 API: /api/progress
- GET with date range: streak, weekly volume, exercise progression, watch trends

### 5.5 Page: /progress
- Streak counter + current week adherence
- Weekly volume bar chart (total sets per week)
- Exercise progression: select exercise → line chart of reps/RPE over time
- Watch data trends: avg HR, calories per week
- Sleep vs RPE correlation scatter (simple)

---

## Sprint 6 — Export

### 6.1 Install dependency
- `npm install @toon-format/toon`

### 6.2 API: GET /api/export
- Query params: `format=csv|json|toon`, `from=YYYY-MM-DD`, `to=YYYY-MM-DD`
- Query DailyLogs with ExerciseLogs and Exercise data in date range
- CSV: flatten to one row per ExerciseLog, all columns from design doc, return as `text/csv`
- JSON: nested structure (session → exercises), return as `application/json`
- TOON: uniform array collapsed with `@toon-format/toon` encoder, return as `text/toon`

### 6.3 Page: /export
- Date range picker (from/to)
- Format selector: CSV / JSON / TOON
- Brief description of each format and best use case
- Download button → hits /api/export and triggers file download

---

## Shared Components (build as needed across sprints)

- `<ExerciseCard />` — reusable card for catalog and routine views
- `<StreakCounter />` — displays current streak
- `<ProgressChart />` — recharts or chart.js line/bar chart wrapper
- Navigation: sidebar or bottom nav (mobile-first)
- Dark mode: Tailwind `dark:` classes throughout

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      # Dashboard redirect to /today
│   ├── today/page.tsx
│   ├── exercises/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── program/page.tsx
│   ├── log/
│   │   ├── page.tsx
│   │   └── [date]/page.tsx
│   ├── progress/page.tsx
│   ├── export/page.tsx
│   └── api/
│       ├── exercises/route.ts
│       ├── exercises/[id]/route.ts
│       ├── daily-log/route.ts
│       ├── daily-log/today/route.ts
│       ├── exercise-log/route.ts
│       ├── exercise-log/[id]/route.ts
│       ├── program/route.ts
│       ├── program/routines/route.ts
│       ├── program/routines/[id]/route.ts
│       ├── log/route.ts
│       ├── log/[date]/route.ts
│       ├── progress/route.ts
│       └── export/route.ts
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── exercise-card.tsx
│   ├── set-tracker.tsx
│   ├── rest-timer.tsx
│   ├── rpe-slider.tsx
│   ├── pain-indicator.tsx
│   ├── post-session-form.tsx
│   ├── progress-chart.tsx
│   ├── streak-counter.tsx
│   └── exercise-picker.tsx
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── export-formatters.ts         # CSV, JSON, TOON formatting logic
└── types/
    └── index.ts                     # Shared TypeScript types
```
