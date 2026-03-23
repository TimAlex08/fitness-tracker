# Workout App — Design Document
**Date:** 2026-03-23
**Status:** Approved

---

## Context

Next.js 14+ App Router app for tracking workout routines. Stack: Prisma + PostgreSQL, Tailwind CSS + shadcn/ui. Current state: minimal schema (Exercise, DailyLog, ExerciseLog) with no pages or components yet.

---

## Goals

1. Register workouts exercise by exercise with RPE rating
2. Manage routines with a structured program (Program → Phase → Routine) plus free-session mode
3. CRUD for exercises and routines
4. Manual entry of Samsung Watch 5 biometric data per session
5. Export data in CSV, JSON, and TOON for external AI analysis

---

## Data Model

### Full schema — one migration from current state

#### Exercise
Expanded from current schema:
- `name`, `slug` (unique), `description`, `imageUrl`, `videoUrl`
- `muscleGroup: String` (CHEST, BACK, LEGS, SHOULDERS, CORE, MOBILITY, FULL_BODY)
- `movementType: String` (PUSH, PULL, SQUAT, HINGE, CARRY, ISOMETRIC, MOBILITY, ACTIVATION)
- `category: String` (STANDARD, REGRESSION, PROGRESSION, PREHAB, WARMUP, COOLDOWN)
- `difficulty: Int` (1-10)
- `parentId: String?` — links regressions/progressions in a hierarchy
- `defaultSets`, `defaultReps`, `defaultDurationSec`, `defaultRestSec`, `defaultTempo`, `defaultRpe`
- `jointStress: String` (NONE, LOW, MODERATE, HIGH)
- `targetJoints: String?`, `contraindications: String?`, `safetyNotes: String?`
- `bodyweightPercent: Float?` — estimated % of bodyweight moved

#### Program / Phase / Routine / RoutineExercise
```
Program (isActive: Boolean)
  └── Phase (order, weekStart, weekEnd, rpeTarget, benchmarks JSON)
        └── Routine (name, dayOfWeek, sessionType, durationMin)
              └── RoutineExercise (order, block, sets, reps, restSec, tempo, rpe, notes)
```

#### DailyLog
- `date: DateTime` (unique per day)
- `routineId: String?` — null for free sessions
- `isFreeSession: Boolean @default(false)`
- `status: String` (PENDING, COMPLETED, PARTIAL, SKIPPED)
- `startedAt`, `finishedAt`, `durationMin`
- **Subjective biometrics:** `overallRpe`, `energyLevel (1-5)`, `sleepHours`, `sleepQuality (1-5)`, `mood (1-5)`, `bodyWeight`, `painLevel (0-10)`, `painNotes`, `notes`
- **Samsung Watch 5 manual entry:** `watchHrAvg`, `watchHrMax`, `watchCalories`, `watchActiveMinutes`, `watchSpO2`, `watchStressScore`, `watchHrZones (String JSON)` — time in each HR zone

#### ExerciseLog
- `dailyLogId`, `exerciseId`
- `completed: Boolean`
- `setsCompleted: Int?`
- `repsPerSet: String?` — JSON array e.g. `"[12,10,8]"`
- `durationSec: Int?` — for isometric holds
- `rpeActual: Int?` (1-10) — primary difficulty rating
- `painDuring: Int?` (0-5) — safety variable, independent of difficulty
- `notes: String?`

#### BodyMeasurement
- `date`, `weight`, `waistCm`, `hipCm`, `chestCm`, `armCm`, `thighCm`, `notes`, `photoUrl`

---

## Pages & Features

### `/today` — Primary view

**Structured mode** (routine assigned from active program):
1. Display today's routine (based on `dayOfWeek` and active program phase)
2. Show each exercise: name, target sets×reps, tempo, target RPE
3. Per exercise: log reps per set + RPE actual + pain (0-5) + optional notes
4. Rest timer between sets
5. Post-session form: watch data + sleep + energy + mood + weight (all optional)

**Free mode** (no routine or improvised day):
1. "Free session" button → exercise search/picker
2. Add exercises on the fly
3. Same per-exercise logging
4. Same post-session form

### `/exercises`
- Grid with filters: muscle group, movement type, category
- Full CRUD: create, edit, delete
- Visual hierarchy: regression → standard → progression
- Search by name

### `/exercises/[id]`
- Exercise detail: description, image/video, safety notes
- Variants tree (regressions / progressions)
- Performance history: reps and RPE over time chart

### `/program`
- View active program with phases and week ranges
- CRUD for routines within each phase
- Add/remove/reorder exercises in a routine
- Set per-routine parameters (sets, reps, rest, target RPE)
- Phase benchmarks (criteria to advance)

### `/log`
- Calendar view with color-coded completion status
- Click day → `/log/[date]`

### `/log/[date]`
- Read-only view of a completed session
- Shows all exercise logs, watch data, biometrics

### `/progress`
- Streak (consecutive completed days)
- Weekly volume (total sets)
- Exercise progression charts (reps/RPE over time)
- Watch data trends: avg HR, calories, HR zones by week
- Simple correlations: sleep vs RPE, energy vs performance
- Body measurements if recorded

### `/export`
- Date range picker
- Format selector: CSV / JSON / TOON
- Download button

---

## Export Formats

### CSV — one row per ExerciseLog
Columns:
```
date, routine_name, exercise_name, muscle_group, movement_type,
sets_completed, reps_per_set, rpe_actual, pain_during, notes,
session_rpe, energy_level, sleep_hours, sleep_quality, mood,
watch_hr_avg, watch_hr_max, watch_calories, watch_active_min,
watch_spo2, watch_stress, watch_hr_zones, body_weight
```
Best for: spreadsheets, pasting into chat interfaces.

### JSON — nested by session
```json
{
  "sessions": [{
    "date": "2026-03-23",
    "routine": "Full Body A",
    "status": "COMPLETED",
    "biometrics": { "sleepHours": 7.5, "energyLevel": 4, "mood": 4 },
    "watch": { "hrAvg": 132, "hrMax": 158, "calories": 380, "hrZones": {...} },
    "exercises": [{
      "name": "Flexiones en pared",
      "muscleGroup": "CHEST",
      "repsPerSet": [12, 11, 10],
      "rpeActual": 7,
      "painDuring": 0
    }]
  }]
}
```
Best for: programmatic analysis, API consumers.

### TOON — token-optimized for LLMs
Uses `@toon-format/toon` NPM package. Uniform arrays collapse into column-headed tables.
```
sessions[N]{date,exercise,muscle,sets,reps,rpe,pain,hr_avg,calories,sleep_h}:
  2026-03-23,Flexiones en pared,CHEST,3,"12,11,10",7,0,132,380,7.5
  2026-03-23,Sentadilla asistida,LEGS,2,"12,12",6,0,132,380,7.5
```
~40% fewer tokens than JSON. Best for: pasting directly into Claude/ChatGPT for AI analysis.

---

## API Routes

```
GET  /api/exercises              — list with filters
POST /api/exercises              — create exercise
GET  /api/exercises/[id]         — detail + history
PUT  /api/exercises/[id]         — update
DELETE /api/exercises/[id]       — delete

GET  /api/program                — active program with phases/routines
POST /api/program/routines       — create routine
PUT  /api/program/routines/[id]  — update routine

GET  /api/daily-log/today        — today's routine + existing log
POST /api/daily-log              — create/update daily log
POST /api/exercise-log           — log one exercise
PUT  /api/exercise-log/[id]      — update exercise log

GET  /api/measurements           — body measurements
POST /api/measurements           — add measurement

GET  /api/export?format=csv|json|toon&from=date&to=date
```

---

## Variables Tracked for AI Analysis

| Source | Variable | Field |
|---|---|---|
| Subjective | RPE per exercise | `ExerciseLog.rpeActual` |
| Subjective | Pain per exercise | `ExerciseLog.painDuring` |
| Subjective | Pre-session energy | `DailyLog.energyLevel` |
| Subjective | Sleep hours + quality | `DailyLog.sleepHours/Quality` |
| Subjective | Mood | `DailyLog.mood` |
| Watch | Avg/max heart rate | `watchHrAvg/Max` |
| Watch | Active calories | `watchCalories` |
| Watch | HR zones | `watchHrZones` |
| Watch | SpO2 | `watchSpO2` |
| Watch | Stress score | `watchStressScore` |
| Performance | Actual reps per set | `ExerciseLog.repsPerSet` |
| Performance | Sets completed | `ExerciseLog.setsCompleted` |
| Adherence | Session status | `DailyLog.status` |

---

## Implementation Order (Sprints)

1. **Sprint 1** — Schema migration + seed Fase Cero exercises + `/today` (structured mode)
2. **Sprint 2** — `/today` free mode + rest timer + post-session form with watch data
3. **Sprint 3** — `/exercises` CRUD + `/exercises/[id]` + exercise hierarchy
4. **Sprint 4** — `/program` CRUD + phase/routine management
5. **Sprint 5** — `/log` + `/log/[date]` + `/progress` charts
6. **Sprint 6** — `/export` with CSV, JSON, TOON (`@toon-format/toon`)
