# Training Dashboard — Design Document
**Date:** 2026-03-23
**Replaces:** `/today` page (session recording only)
**New route:** `/training` (dashboard) + `/training/session` (session recording)

---

## Problem

The current `/today` page only handles one thing: recording today's session. There is no way to see weekly progress, historical adherence, or context about the training plan at a glance. The user needs a dashboard that shows where they stand in their training week and motivates continuity.

---

## Goal

A single `/training` screen that:
1. Shows the current week with progress at a glance (default view)
2. Provides a monthly calendar with "don't break the chain" visual
3. Provides a yearly heatmap (GitHub-style) for long-term adherence
4. Surfaces today's assigned routine and provides a direct entry point to the session

---

## Routes

```
/training                  ← new main dashboard (replaces /today as home)
/training/session          ← rename current /today/page.tsx here
```

```
app/(app)/
├── training/
│   ├── page.tsx           ← Server Component: fetches current week data
│   └── session/
│       └── page.tsx       ← moved from app/(app)/today/page.tsx
```

---

## Architecture

**Server Component (`/training/page.tsx`):**
- Always fetches the current week (7 days) on initial load
- Passes data to `TrainingDashboard` client component

**Client Component (`TrainingDashboard`):**
- Holds active view state: `week | month | year`
- Renders `WeekView`, `MonthView`, or `YearView`
- Lazy-fetches month/year data on first switch to that view

**New components:**
| Component | Purpose |
|---|---|
| `TrainingDashboard` | Client orchestrator, view selector |
| `WeekView` | 7 cards with today highlighted |
| `MonthView` | Calendar with chain visualization |
| `YearView` | Heatmap grid (GitHub-style) |

---

## View 1 — Week (default)

Layout:
- Header: "Semana 12 · Mar 2026" + view selector tabs [Sem | Mes | Año]
- Quick status strip: 7 day icons with status badge
- **Today card (large):** routine name, exercise count, estimated duration, RPE target range, "Iniciar sesión →" button. If session already started: shows X/Y exercises progress. If completed: shows RPE and real duration.
- **Other day cards (compact):** routine name, status icon, key metric if completed (RPE avg · duration · N exercises)

**Day status values:**
| Status | Display |
|---|---|
| COMPLETED | ✓ green |
| PARTIAL | ~ yellow |
| SKIPPED | ✗ red |
| PENDING | — gray |
| REST (no routine assigned) | 💤 auto-approved |

---

## View 2 — Month ("Don't Break the Chain")

Layout:
- Header: "Marzo 2026" + `← →` navigation
- Summary row: `Racha actual: 🔥 N días | Mes: X/Y días | Adherencia: Z%`
- Full calendar grid (Mon–Sun)

**Day cell visual:**
| Status | Style |
|---|---|
| COMPLETED or REST | Solid green circle |
| PARTIAL | Yellow circle |
| SKIPPED | Red circle |
| Future / no data | Gray outline circle |
| Today | Green/gray circle + highlight ring |

**Chain visualization:**
- Consecutive completed/rest days are connected by a continuous horizontal band between circles
- A missed day (SKIPPED) breaks the band
- Calculated client-side from month data

---

## View 3 — Year (GitHub Heatmap)

Layout:
- Header: "2026 · N sesiones · Racha máx: N días 🔥"
- Grid: columns = weeks, rows = days of week (Mon–Sun), labels above for months
- Each cell: ~12px square

**Cell color scale:**
| Status | Color |
|---|---|
| COMPLETED | Dark green |
| REST (no routine) | Light green (auto-approved) |
| PARTIAL | Yellow |
| SKIPPED | Muted red |
| Future / no data | Gray outline |

**Interaction:** hover tooltip showing date, routine name, key metric (RPE, duration).

**Summary above grid:** total sessions in year, current streak, max streak.

---

## APIs

### Existing (reused, no changes)
- `GET /api/daily-log/today` — used for today's card data
- `POST /api/daily-log` — used in session
- `POST /api/exercise-log` — used in session

### New
```
GET /api/training/week?date=YYYY-MM-DD
→ Returns 7 days for the week containing `date`
→ Each day: { date, dayOfWeek, routine: { name, exerciseCount, estimatedDuration, rpeTarget } | null, dailyLog: { status, rpeActual, durationMin, exercisesCompleted } | null }

GET /api/training/month?year=YYYY&month=MM
→ Returns all days in the month
→ Each day: { date, status, isRest, chainActive }

GET /api/training/year?year=YYYY
→ Returns all days in the year (minimal payload)
→ Each day: { date, status, isRest }
```

### REST day logic
- A day with no `Routine` assigned in the active `Program → Phase` is automatically treated as REST
- REST days count as "approved" in chain and heatmap (light green)
- No manual registration required

---

## Data Flow

```
User opens /training
  → Server fetches current week data
  → Renders TrainingDashboard with week data

User clicks [Mes]
  → Client fetches /api/training/month (lazy, once)
  → Renders MonthView

User clicks [Año]
  → Client fetches /api/training/year (lazy, once)
  → Renders YearView

User clicks "Iniciar sesión" on today's card
  → Navigate to /training/session
  → (existing TodaySession logic, renamed path)
```

---

## Out of Scope

- Editing routine assignments from `/training` (handled in `/program`)
- Push notifications or reminders
- Comparing weeks side by side
