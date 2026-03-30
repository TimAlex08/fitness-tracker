# Fitness Tracker — Master Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the fitness tracker app across three sequential phases — Security hardening, Architecture cleanup, and Mobile-first UI — producing a secure, maintainable, and mobile-optimized app.

**Architecture:** Security-First Secuencial (Option A): close all auth gaps globally first, then complete Repository/Service patterns, then redesign the mobile UI. Each phase is independently deployable.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL), Tailwind CSS, shadcn/ui, TypeScript, Zod, bcryptjs

**Spec:** `docs/superpowers/specs/2026-03-29-fitness-tracker-master-plan-design.md`

---

## PHASE 1 — SECURITY

### Task 1: `lib/api-error.ts` — Standardized API error helper

**Files:**
- Create: `lib/api-error.ts`

- [ ] **Step 1: Create the helper**

```typescript
// lib/api-error.ts
import { NextResponse } from "next/server"

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api-error.ts
git commit -m "feat(security): add apiError helper for consistent error responses"
```

---

### Task 2: `lib/with-auth.ts` — Auth guard wrapper for API routes

**Files:**
- Create: `lib/with-auth.ts`

- [ ] **Step 1: Create the withAuth wrapper**

```typescript
// lib/with-auth.ts
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export type AuthedRequest = NextRequest & { userId: string }

type AuthedHandler = (
  req: AuthedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    ;(req as AuthedRequest).userId = user.id
    return handler(req as AuthedRequest, context)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/with-auth.ts
git commit -m "feat(security): add withAuth wrapper for API route protection"
```

---

### Task 3: Add auth to `exercises` routes

**Files:**
- Modify: `app/api/exercises/route.ts`
- Modify: `app/api/exercises/[id]/route.ts`

**Context:** These are the two API routes with zero auth. Anyone can GET, POST, PUT, DELETE exercises without being logged in.

- [ ] **Step 1: Update `app/api/exercises/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { createExerciseSchema } from "@/features/exercises/schemas/exercise.schema"
import { apiError } from "@/lib/api-error"
import type { MuscleGroup } from "@prisma/client"

const repo = new PrismaExerciseRepository()

export async function GET(request: NextRequest) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { searchParams } = new URL(request.url)
    const muscleGroup = searchParams.get("muscleGroup") as MuscleGroup | null
    const search = searchParams.get("q") ?? undefined

    const exercises = await repo.findAll({
      muscleGroup: muscleGroup ?? undefined,
      search,
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error("[GET /api/exercises]", error)
    return apiError("Error fetching exercises", 500)
  }
}

export async function POST(request: NextRequest) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const body = await request.json()
    const parsed = createExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const exercise = await repo.create(parsed.data)
    return NextResponse.json(exercise, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/exercises]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return apiError("Ya existe un ejercicio con ese slug", 409)
    }
    return apiError("Error creando ejercicio", 500)
  }
}
```

- [ ] **Step 2: Update `app/api/exercises/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { PrismaExerciseRepository } from "@/features/exercises/api/prisma-exercise-repository"
import { ExerciseHasLogsError } from "@/features/exercises/api/exercise-repository"
import { updateExerciseSchema } from "@/features/exercises/schemas/exercise.schema"
import { apiError } from "@/lib/api-error"

const repo = new PrismaExerciseRepository()

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    const exercise = await repo.findById(id)
    if (!exercise) return apiError("Ejercicio no encontrado", 404)
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[GET /api/exercises/[id]]", error)
    return apiError("Error fetching exercise", 500)
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateExerciseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const exercise = await repo.update(id, parsed.data)
    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[PUT /api/exercises/[id]]", error)
    return apiError("Error updating exercise", 500)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  try {
    const { id } = await params
    await repo.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ExerciseHasLogsError) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${error.logCount} registro(s). Elimina los registros primero.` },
        { status: 409 }
      )
    }
    console.error("[DELETE /api/exercises/[id]]", error)
    return apiError("Error deleting exercise", 500)
  }
}
```

- [ ] **Step 3: Verify in browser that GET /api/exercises returns 401 without a session cookie**

Open an incognito window and navigate to `/api/exercises`. Expect: `{"error":"Unauthorized"}` with status 401.

- [ ] **Step 4: Commit**

```bash
git add app/api/exercises/route.ts app/api/exercises/[id]/route.ts
git commit -m "fix(security): require auth on all /api/exercises endpoints"
```

---

### Task 4: Add auth + userId filter to `training` routes

**Files:**
- Modify: `app/api/training/month/route.ts`
- Modify: `app/api/training/week/route.ts`
- Modify: `app/api/training/year/route.ts`

**Context:** These three routes have no auth AND no userId filter — they return data from all users.

- [ ] **Step 1: Update `app/api/training/month/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { PrismaTrainingRepository } from "@/features/training/api/prisma-training-repository"

const repo = new PrismaTrainingRepository()

export async function GET(request: Request) {
  const user = await getSession()
  if (!user) return apiError("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")

  const now = new Date()
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear()
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return apiError("Invalid year or month", 400)
  }

  const data = await repo.getMonthData(year, month, user.id)
  return NextResponse.json(data)
}
```

- [ ] **Step 2: Update `PrismaTrainingRepository.getMonthData` to accept `userId`**

Open `features/training/api/prisma-training-repository.ts`. Add `userId: string` parameter to `getMonthData`, `getWeekData`, and `getYearData`. Filter all queries by `userId` in the `where` clause. Example for `getMonthData`:

```typescript
async getMonthData(year: number, month: number, userId: string): Promise<MonthData> {
  // Add userId to all DailyLog queries:
  // where: { userId, date: { gte: startDate, lt: endDate } }
}
```

- [ ] **Step 3: Apply the same pattern to `week/route.ts` and `year/route.ts`**

Follow the exact same pattern as Step 1 for:
- `app/api/training/week/route.ts` → call `repo.getWeekData(year, week, user.id)`
- `app/api/training/year/route.ts` → call `repo.getYearData(year, user.id)`

- [ ] **Step 4: Commit**

```bash
git add app/api/training/ features/training/api/prisma-training-repository.ts
git commit -m "fix(security): require auth and userId isolation on training routes"
```

---

### Task 5: Standardize error responses across all existing API routes

**Files:**
- Modify: `app/api/routines/route.ts`, `app/api/routines/[id]/route.ts`, `app/api/routines/[id]/exercises/route.ts`
- Modify: `app/api/programs/route.ts`, `app/api/programs/[id]/route.ts`, `app/api/programs/active/route.ts`
- Modify: `app/api/daily-log/route.ts`, `app/api/daily-log/today/route.ts`
- Modify: `app/api/exercise-log/route.ts`, `app/api/exercise-log/[id]/route.ts`
- Modify: `app/api/measurements/route.ts`, `app/api/export/route.ts`

**Context:** All these routes use inline `NextResponse.json({ error: "..." }, { status: N })`. Replace with `apiError()`. Also ensure Prisma error codes (e.g. `P2002`) are never returned raw to the client.

- [ ] **Step 1: In each file, import `apiError` and replace inline error returns**

For each of the files above:
```typescript
// Before:
return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
// After:
return apiError("Unauthorized", 401)
```

Also replace raw 500 errors that expose `error.message`:
```typescript
// Before:
return NextResponse.json({ error: error.message }, { status: 500 })
// After:
console.error("[CONTEXT]", error)
return apiError("Internal server error", 500)
```

- [ ] **Step 2: Commit**

```bash
git add app/api/
git commit -m "refactor(security): standardize error responses using apiError helper"
```

---

### Task 6: Rate limiting on auth endpoints

**Files:**
- Create: `lib/rate-limit.ts`
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/register/route.ts`

- [ ] **Step 1: Create in-memory rate limiter**

```typescript
// lib/rate-limit.ts
const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = requests.get(key)

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }

  if (entry.count >= limit) return false // blocked

  entry.count++
  return true // allowed
}
```

- [ ] **Step 2: Apply to `app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, createSession, sessionCookieOptions } from "@/lib/auth"
import { apiError } from "@/lib/api-error"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  if (!rateLimit(`login:${ip}`, 10, 60_000)) {
    return apiError("Demasiados intentos. Espera 1 minuto.", 429)
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return apiError("Email y contraseña requeridos", 400)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.password))) {
    return apiError("Credenciales incorrectas", 401)
  }

  const token = await createSession(user.id)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(sessionCookieOptions(token))
  return response
}
```

- [ ] **Step 3: Apply to `app/api/auth/register/route.ts`**

Same pattern: add rate limit check (`register:${ip}`, 5, 60_000) as the first thing inside the handler.

- [ ] **Step 4: Commit**

```bash
git add lib/rate-limit.ts app/api/auth/login/route.ts app/api/auth/register/route.ts
git commit -m "feat(security): add in-memory rate limiting to auth endpoints"
```

---

### Task 7: Security headers in `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Read the current `next.config.ts`**

Open `next.config.ts` and locate the export. Add `headers()` function:

```typescript
// next.config.ts (add inside the config object)
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ]
},
```

- [ ] **Step 2: Verify headers are present**

Run `npm run dev`, open browser devtools → Network → any request → Response Headers. Confirm `X-Frame-Options: DENY` appears.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(security): add HTTP security headers"
```

---

### Task 8: Audit and fix `prisma.$queryRaw` usage

**Files:**
- Audit: all files in `features/` and `app/api/`

- [ ] **Step 1: Search for raw queries**

```bash
grep -r "queryRaw\|executeRaw\|\$query\|\$execute" . --include="*.ts" --exclude-dir=node_modules
```

Expected: No results (Prisma ORM is used throughout). If any `$queryRaw` is found without `Prisma.sql` template literal, replace with ORM equivalent.

- [ ] **Step 2: Verify `contains` + `mode: insensitive` are safe**

Open `features/exercises/api/prisma-exercise-repository.ts:64-70`. Confirm the search filter uses Prisma's built-in operators:
```typescript
// This is safe — Prisma parameterizes this automatically
name: { contains: filters.search, mode: "insensitive" }
```
No changes needed if this is the pattern used.

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add .
git commit -m "fix(security): ensure no raw SQL queries without parameterization"
```

---

## PHASE 2 — ARCHITECTURE

### Task 9: `features/progress/api/progress-repository.ts` — Abstract interface

**Files:**
- Create: `features/progress/api/progress-repository.ts`
- Modify: `features/progress/api/prisma-progress-repository.ts`

**Context:** `prisma-progress-repository.ts` exists but has no interface. Following the pattern of `features/exercises/api/exercise-repository.ts`.

- [ ] **Step 1: Read `features/progress/api/prisma-progress-repository.ts` to understand its public methods**

Note the method signatures (names, parameters, return types).

- [ ] **Step 2: Create the interface**

```typescript
// features/progress/api/progress-repository.ts
import type { ProgressStats, VolumeData, ExerciseProgression, PhaseBenchmark } from "@/features/progress/types/progress.types"

export interface ProgressRepository {
  getStats(userId: string): Promise<ProgressStats>
  getVolumeByWeek(userId: string, weeks: number): Promise<VolumeData[]>
  getExerciseProgression(userId: string, exerciseId: string): Promise<ExerciseProgression>
  getPhaseBenchmarks(userId: string): Promise<PhaseBenchmark[]>
}
```

Adjust method signatures to match what `prisma-progress-repository.ts` actually implements.

- [ ] **Step 3: Add `implements ProgressRepository` to `PrismaProgressRepository`**

```typescript
// features/progress/api/prisma-progress-repository.ts
import type { ProgressRepository } from "./progress-repository"

export class PrismaProgressRepository implements ProgressRepository {
  // existing code unchanged
}
```

- [ ] **Step 4: Commit**

```bash
git add features/progress/api/
git commit -m "refactor(arch): add ProgressRepository interface (SOLID DIP)"
```

---

### Task 10: `features/training/api/training-repository.ts` — Abstract interface

**Files:**
- Create: `features/training/api/training-repository.ts`
- Modify: `features/training/api/prisma-training-repository.ts`

- [ ] **Step 1: Read `features/training/api/prisma-training-repository.ts` to identify public methods**

Note all `async` methods and their signatures.

- [ ] **Step 2: Create the interface**

```typescript
// features/training/api/training-repository.ts
import type { WeekData, MonthData, YearData } from "@/features/training/types/training.types"

export interface TrainingRepository {
  getWeekData(year: number, week: number, userId: string): Promise<WeekData>
  getMonthData(year: number, month: number, userId: string): Promise<MonthData>
  getYearData(year: number, userId: string): Promise<YearData>
}
```

Adjust method signatures to match the actual implementation (including the new `userId` parameter added in Task 4).

- [ ] **Step 3: Add `implements TrainingRepository` to the class**

```typescript
import type { TrainingRepository } from "./training-repository"
export class PrismaTrainingRepository implements TrainingRepository {
  // existing code
}
```

- [ ] **Step 4: Commit**

```bash
git add features/training/api/
git commit -m "refactor(arch): add TrainingRepository interface (SOLID DIP)"
```

---

### Task 11: `features/session/services/session.service.ts` — Extract business logic

**Files:**
- Create: `features/session/services/session.service.ts`
- Modify: `features/session/hooks/use-session-state.ts`

**Context:** `useSessionState.ts` currently calculates `CompletionStatus` (COMPLETED/PARTIAL/SKIPPED) — business logic that doesn't belong in a client hook. Extract it to a pure function in a service file.

- [ ] **Step 1: Create the service with the extracted logic**

```typescript
// features/session/services/session.service.ts
import type { CompletionStatus } from "@prisma/client"

export function calculateCompletionStatus(
  completedCount: number,
  total: number
): CompletionStatus {
  if (completedCount === 0) return "SKIPPED"
  if (completedCount === total) return "COMPLETED"
  return "PARTIAL"
}

export function parseRepsPerSet(repsPerSet: string | null | undefined): number[] {
  if (!repsPerSet) return []
  try {
    const parsed = JSON.parse(repsPerSet)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeRepsPerSet(reps: number[]): string {
  return JSON.stringify(reps)
}
```

- [ ] **Step 2: Update `use-session-state.ts` to import from service**

In `handleFinishSession`, replace the inline status calculation:
```typescript
// Before (inside use-session-state.ts):
const status =
  completedCount === 0 ? "SKIPPED" : completedCount === total ? "COMPLETED" : "PARTIAL"

// After:
import { calculateCompletionStatus } from "@/features/session/services/session.service"
const status = calculateCompletionStatus(completedCount, total)
```

In `initExerciseState`, replace the inline JSON.parse:
```typescript
// Before:
const parsed = JSON.parse(existingLog.repsPerSet)
if (Array.isArray(parsed)) reps = parsed[i] ?? 0

// After:
import { parseRepsPerSet } from "@/features/session/services/session.service"
const parsedReps = parseRepsPerSet(existingLog.repsPerSet)
reps = parsedReps[i] ?? 0
```

- [ ] **Step 3: Commit**

```bash
git add features/session/services/ features/session/hooks/use-session-state.ts
git commit -m "refactor(arch): extract session business logic to service (SOLID SRP)"
```

---

### Task 12: Centralize `repsPerSet` serialization in the exercise log repository

**Files:**
- Modify: `features/session/api/prisma-session-repository.ts`

**Context:** Any place that reads `ExerciseLog.repsPerSet` from the DB should use `parseRepsPerSet`. Any place that writes it should use `serializeRepsPerSet`. Centralize in the repository layer.

- [ ] **Step 1: Open `features/session/api/prisma-session-repository.ts` and find all `repsPerSet` usages**

```bash
grep -n "repsPerSet" features/session/api/prisma-session-repository.ts
```

- [ ] **Step 2: Import and use the service functions**

```typescript
import { parseRepsPerSet, serializeRepsPerSet } from "@/features/session/services/session.service"

// When writing:
repsPerSet: serializeRepsPerSet(data.repsPerSet)

// When reading (in the returned DTO):
repsPerSet: parseRepsPerSet(log.repsPerSet)
```

- [ ] **Step 3: Remove any remaining `JSON.parse`/`JSON.stringify` calls for `repsPerSet` in hooks and components**

```bash
grep -rn "JSON.parse.*repsPerSet\|JSON.stringify.*repsPerSet" features/ --include="*.ts" --include="*.tsx"
```

Replace any found with the service functions.

- [ ] **Step 4: Commit**

```bash
git add features/session/
git commit -m "refactor(arch): centralize repsPerSet serialization in repository"
```

---

## PHASE 3 — UI/MOBILE

### Task 13: Viewport and PWA meta tags in `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`
- Create: `public/manifest.json`

- [ ] **Step 1: Update `app/layout.tsx` viewport and meta tags**

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Fitness Tracker",
  description: "Registro y seguimiento de entrenamiento",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fitness Tracker",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",   // <-- safe areas (iPhone notch)
  themeColor: "#09090b",  // zinc-950
}
```

- [ ] **Step 2: Create `public/manifest.json`**

```json
{
  "name": "Fitness Tracker",
  "short_name": "Fitness",
  "description": "Registro y seguimiento de entrenamiento",
  "start_url": "/today",
  "display": "standalone",
  "background_color": "#09090b",
  "theme_color": "#09090b",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Note: Create placeholder 192×192 and 512×512 PNG icons in `/public/` (can be simple zinc-colored squares initially).

- [ ] **Step 3: Add `color-scheme` to root layout**

In `app/layout.tsx`, ensure `<html>` has `className` that sets dark scheme:
```tsx
<html lang="es" className="dark" style={{ colorScheme: "dark" }}>
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx public/manifest.json public/icon-192.png public/icon-512.png
git commit -m "feat(pwa): add manifest, viewport-fit=cover, and color-scheme meta"
```

---

### Task 14: Bottom navigation component for mobile

**Files:**
- Create: `components/layout/bottom-nav.tsx`
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Create `components/layout/bottom-nav.tsx`**

```tsx
// components/layout/bottom-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Dumbbell, BarChart2, BookOpen } from "lucide-react"

const NAV_ITEMS = [
  { href: "/today", label: "Hoy", icon: CalendarDays },
  { href: "/training", label: "Entreno", icon: Dumbbell },
  { href: "/progress", label: "Progreso", icon: BarChart2 },
  { href: "/exercises", label: "Ejercicios", icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-zinc-900 border-t border-zinc-800"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label="Navegación principal"
    >
      <ul className="flex items-center justify-around px-2 pt-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-1 rounded-lg transition-colors min-h-[48px] justify-center ${
                  active
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-2"}`}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 2: Add `BottomNav` to `app/(app)/layout.tsx`**

```tsx
// app/(app)/layout.tsx
import { BottomNav } from "@/components/layout/bottom-nav"

// Inside the JSX, after </main>:
<BottomNav />

// Add bottom padding to main to avoid content hiding behind nav on mobile:
<main
  className="flex-1 overflow-y-auto pb-20 lg:pb-0"
  id="main-content"
  aria-label="Contenido principal"
>
```

- [ ] **Step 3: Commit**

```bash
git add components/layout/bottom-nav.tsx app/(app)/layout.tsx
git commit -m "feat(mobile): add bottom navigation bar for mobile screens"
```

---

### Task 15: Mobile-first redesign of `/today` session cards

**Files:**
- Modify: `features/session/components/set-row.tsx`
- Modify: `features/session/components/exercise-session-card.tsx`
- Modify: `features/session/components/session-progress-card.tsx`

**Context:** The `/today` view is used in the gym on mobile. Touch targets must be ≥48px. Completing a set is the most frequent action and must be effortless.

- [ ] **Step 1: Read `features/session/components/set-row.tsx`**

Identify the button for logging/completing a set. Ensure:
1. Min height of 48px: `className="min-h-[48px]"`
2. Touch feedback: `active:scale-95 transition-transform`
3. `touch-action: manipulation` on interactive elements to prevent double-tap zoom delay

```tsx
// Add to any button in set-row.tsx that records a set:
className="min-h-[48px] min-w-[48px] active:scale-95 transition-transform"
style={{ touchAction: "manipulation" }}
```

- [ ] **Step 2: Read `features/session/components/exercise-session-card.tsx`**

Add visual completion state. When an exercise is `completed === true`, apply a distinct completed style:
```tsx
className={`rounded-xl border p-4 transition-colors ${
  exerciseState.completed
    ? "border-emerald-800 bg-emerald-950/40"
    : "border-zinc-800 bg-zinc-900"
}`}
```

Add `aria-label` to any icon-only buttons:
```tsx
// Before:
<Button variant="ghost" size="icon"><CheckIcon /></Button>
// After:
<Button variant="ghost" size="icon" aria-label="Completar ejercicio"><CheckIcon aria-hidden="true" /></Button>
```

- [ ] **Step 3: Add session progress indicator to `session-progress-card.tsx`**

Ensure the progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`:
```tsx
<div
  role="progressbar"
  aria-valuenow={completed}
  aria-valuemin={0}
  aria-valuemax={total}
  aria-label={`${completed} de ${total} ejercicios completados`}
>
```

- [ ] **Step 4: Commit**

```bash
git add features/session/components/
git commit -m "feat(mobile): improve touch targets and visual feedback in session cards"
```

---

### Task 16: Rest timer as full-screen bottom sheet on mobile

**Files:**
- Modify: `features/session/components/rest-timer.tsx`

**Context:** The rest timer is currently a small widget. On mobile in the gym, it needs to be the primary focal point when active.

- [ ] **Step 1: Read the current `features/session/components/rest-timer.tsx`**

Identify how it's shown/hidden (likely a conditional render or opacity toggle).

- [ ] **Step 2: Wrap in a full-screen overlay on mobile**

```tsx
// rest-timer.tsx
{visible && (
  <div
    className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:relative lg:inset-auto"
    style={{ overscrollBehavior: "contain" }}
  >
    {/* Backdrop — mobile only */}
    <div
      className="absolute inset-0 bg-black/60 lg:hidden"
      onClick={onDismiss}
      aria-hidden="true"
    />
    {/* Timer card */}
    <div
      className="relative z-10 w-full lg:w-auto bg-zinc-900 rounded-t-2xl lg:rounded-xl p-8 pb-[max(2rem,env(safe-area-inset-bottom))] lg:pb-8"
    >
      {/* existing timer content */}
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add features/session/components/rest-timer.tsx
git commit -m "feat(mobile): rest timer as full-screen bottom sheet on mobile"
```

---

### Task 17: Dark mode audit — fix white backgrounds in shadcn components

**Files:**
- Modify: Various `components/ui/` files and feature components

- [ ] **Step 1: Search for white/light background classes that break dark mode**

```bash
grep -rn "bg-white\|bg-gray-50\|bg-slate-50\|bg-neutral-50" components/ features/ app/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Replace with zinc equivalents**

For each match found:
- `bg-white` → `bg-zinc-900`
- `bg-gray-50` → `bg-zinc-950`
- `text-gray-900` (on white bg) → `text-zinc-100`
- `text-gray-500` → `text-zinc-400`
- `border-gray-200` → `border-zinc-800`

- [ ] **Step 3: Check `<select>` elements for Windows dark mode**

```bash
grep -rn "<select\|Select" components/ui/ --include="*.tsx"
```

Ensure any native `<select>` has explicit `background-color` and `color` in dark context (Windows dark mode bug).

- [ ] **Step 4: Commit**

```bash
git add components/ features/ app/
git commit -m "fix(ui): fix white backgrounds leaking in dark mode"
```

---

### Task 18: Accessibility audit on key components

**Files:**
- Modify: `components/layout/sidebar-nav-links.tsx`
- Modify: `features/exercises/components/exercise-filters.tsx`
- Modify: `features/session/components/exercise-active-form.tsx`

**Context:** Applying web-interface-guidelines rules: aria-labels, focus states, form labels.

- [ ] **Step 1: Audit icon-only buttons for missing `aria-label`**

```bash
grep -rn "size=\"icon\"\|IconButton\|<Button.*>.*Icon\b" features/ components/ --include="*.tsx" | grep -v "aria-label"
```

For each result, add `aria-label="[acción descriptiva]"` and `aria-hidden="true"` to the icon.

- [ ] **Step 2: Audit form inputs for missing labels**

```bash
grep -rn "<Input\|<input\|<Textarea" features/ --include="*.tsx" | grep -v "aria-label\|htmlFor\|<label"
```

For each unaccompanied input, add either a wrapping `<label>` or `aria-label` prop.

- [ ] **Step 3: Add `aria-live="polite"` to async feedback zones**

In `features/session/components/today-session.tsx` or the parent component, wrap the exercise completion toast/feedback area:
```tsx
<div aria-live="polite" aria-atomic="true">
  {/* completion messages */}
</div>
```

- [ ] **Step 4: Add `focus-visible:ring-2` to any interactive element missing a focus ring**

```bash
grep -rn "outline-none" components/ features/ --include="*.tsx"
```

For each `outline-none`, verify there's a `focus-visible:ring-*` replacement. If not, add it.

- [ ] **Step 5: Commit**

```bash
git add components/ features/
git commit -m "fix(a11y): add missing aria-labels, form labels, and focus states"
```

---

### Task 19: Responsive grid layouts for secondary views

**Files:**
- Modify: `features/progress/components/stats-strip.tsx`
- Modify: `app/(app)/exercises/page.tsx`
- Modify: `features/training/components/training-dashboard.tsx`

**Context:** These views need to adapt gracefully to small screens. Mobile: 1–2 columns. Desktop: 3–4 columns.

- [ ] **Step 1: Update `stats-strip.tsx` grid**

```tsx
// Before (likely fixed grid):
<div className="grid grid-cols-4 gap-4">
// After:
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
```

- [ ] **Step 2: Update exercise catalog grid in `exercises/page.tsx`**

```tsx
// Before:
<div className="grid grid-cols-3 gap-4">
// After:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

- [ ] **Step 3: Update training dashboard for mobile**

In `training-dashboard.tsx`, ensure week/month views have horizontal scroll on mobile rather than overflowing:
```tsx
<div className="overflow-x-auto -mx-4 px-4">
  {/* calendar grid */}
</div>
```

- [ ] **Step 4: Commit**

```bash
git add features/progress/ app/(app)/exercises/ features/training/
git commit -m "feat(responsive): responsive grids for progress, exercises, and training views"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec requirement | Task |
|---|---|
| Auth guard on all API routes | Tasks 3, 4 |
| `withAuth` helper | Task 2 |
| `apiError` helper | Task 1 |
| Rate limiting on auth endpoints | Task 6 |
| Ownership validation | Tasks 3, 4 (userId filter on training) |
| SQL injection audit | Task 8 |
| Security headers | Task 7 |
| ProgressRepository interface | Task 9 |
| TrainingRepository interface | Task 10 |
| Session service layer | Task 11 |
| `repsPerSet` centralized | Task 12 |
| Error handling standard | Task 5 |
| `/today` mobile redesign | Tasks 15, 16 |
| Bottom navigation | Task 14 |
| Visual feedback on actions | Task 15 |
| Responsive secondary views | Task 19 |
| Dark mode complete | Task 17 |
| PWA basic | Task 13 |
| Accessibility (aria, focus) | Task 18 |

### Type Consistency
- `calculateCompletionStatus` defined in Task 11, used in Task 11 ✓
- `parseRepsPerSet` / `serializeRepsPerSet` defined in Task 11, used in Tasks 11–12 ✓
- `TrainingRepository` interface defined in Task 10, updated with `userId` from Task 4 ✓
- `apiError` defined in Task 1, used from Task 3 onward ✓

### Execution Order Dependencies
- Task 1 (`apiError`) must come before Task 3, 4, 5, 6 (all use it)
- Task 11 (service) must come before Task 12 (uses service functions)
- Task 4 (`userId` in training repo) must come before Task 10 (interface reflects new signature)
- Task 13 (viewport) must come before Task 14 (bottom nav uses safe areas)
