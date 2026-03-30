# Plan de Implementación — Vista General (Overview Dashboard)

**Fecha:** 2026-03-30
**Diseño de referencia:** Figma — "Workout App — Vista General" (fileKey: `2iuo1Mfl28TSEoaRRrVRUz`)
**Ruta destino:** `app/(app)/page.tsx`

---

## Resumen visual del diseño

### Móvil (390×844)

```
┌───────────────────────────┐
│ Lunes · 30 de marzo       │  text-sm zinc-500
│ Buenos días 👋  (bold 26) │  text-white font-bold
├───────────────────────────┤
│ DOM  LUN  MAR  MIÉ  JUE  VIE  SÁB  │  WeeklyStrip
│  ●    ◉    ○    ○    ○    ◌    ○    │  zinc-900 bg
│ 29   30   31   1    2    3    4     │  sticky top-0
├───────────────────────────┤
│ 🔥 12 días  │ 🎯 8/10     │  MetricsPair
│ Racha       │ Sesiones    │  2 cards zinc-900
│             │ [██████░░]  │  barra progreso
├───────────────────────────┤
│ ┌─── SESIÓN DE HOY ─────┐ │
│ │ Full Body A (bold 28) │ │  TrainingDayCard
│ │ 8 ejercicios · RPE 6-7│ │  borde emerald/20
│ │ [Sin iniciar]         │ │  glow verde sutil
│ │ [▶ INICIAR] (emerald) │ │
│ └───────────────────────┘ │
│  · · · Nutrición · · ·   │  placeholder dashed
└───────────────────────────┘
```

### Estado: Día de descanso (Móvil)
- Greeting: "Hoy descansas 🌙"
- Strip: día activo en azul (`blue-400`) en lugar de verde
- Pill `← Hoy` en top-right si `selectedDate ≠ today`
- Card con borde `blue/20`, glow azul, texto motivacional + botón `+ Registrar sesión libre`

### Desktop / Web (1440×900)

```
┌──────────┬──────────────────────────────────────────────────┐
│ SIDEBAR  │ Lunes · 30 de marzo                              │
│ 256px    │ Buenos días 👋  (bold 30)                        │
│ zinc-900 │                                                  │
│  [W]     │ [──── Weekly Strip (7 días) ────────────────]    │
│ Workout  │                                                  │
│ ──────── │ ┌──────────────────────┐  ┌──────────────────┐  │
│ ● Hoy    │ │ SESIÓN DE HOY        │  │ 🔥 12 días       │  │
│  Training│ │ Full Body A (bold 38)│  │ Racha actual     │  │
│  Progreso│ │ 8 ejercicios RPE 6-7 │  │ Sigue así 💪     │  │
│  Ejercic │ │ · Sentadilla Goblet  │  ├──────────────────┤  │
│ ──────── │ │ · Bisagra de cadera  │  │ 🎯 8 / 10        │  │
│ [TA]     │ │ · Plancha abdominal  │  │ Sesiones del mes │  │
│ Tim Alex │ │ + 5 más              │  │ [████████░░]     │  │
│ Fase Cero│ │ [▶ INICIAR] (full)   │  │ 2 para la meta   │  │
└──────────┴──────────────────────────────────────────────────┘
```

---

## Tokens de diseño extraídos

| Elemento | Valor Figma | Token Tailwind |
|---|---|---|
| Fondo página | `#09090B` | `bg-zinc-950` |
| Fondo cards | `#18181B` | `bg-zinc-900` |
| Borde cards | `#27272A` | `border-zinc-800` |
| Texto principal | `#FAFAFA` | `text-white` |
| Texto muted | `#71717A` | `text-zinc-500` |
| Texto muted2 | `#A1A1AA` | `text-zinc-400` |
| Acento verde | `#10B981` | `text-emerald-500 / bg-emerald-500` |
| Verde claro | `#34D399` | `text-emerald-400` |
| Azul descanso | `#60A5FA` | `text-blue-400` |
| Sky (botón) | `#38BDF8` | `text-sky-400` |
| Radius cards | `20px` | `rounded-2xl` |
| Radius botones | `14px` | `rounded-xl` |
| Radius pills | `12-14px` | `rounded-full` |
| Padding página (móvil) | `20px` | `px-5` |
| Padding página (web) | `40px` | `px-10` |
| Gap columnas (web) | `24px` | `gap-6` |

---

## Archivos a crear / modificar

### Nuevos archivos

| Ruta | Tipo | Descripción |
|---|---|---|
| `features/session/components/overview-dashboard.tsx` | Client | Orquestador principal |
| `features/session/components/overview-header.tsx` | Client | Saludo + fecha |
| `features/session/components/metrics-pair.tsx` | Client | Racha + Hito (2 cards) |
| `features/session/components/training-day-card.tsx` | Client | Card día de entrenamiento |
| `features/session/components/rest-day-card.tsx` | Client | Card día de descanso |
| `features/session/components/back-to-today-pill.tsx` | Client | Botón "← Hoy" |

### Archivos modificados

| Ruta | Cambio |
|---|---|
| `app/(app)/page.tsx` | Reemplazar contenido por `<OverviewDashboard>` |
| `features/training/components/weekly-strip.tsx` | Añadir prop `onDaySelect?: (date: string) => void` y `selectedDate?: string` |

---

## Especificación de componentes

### 1. `WeeklyStrip` — modificación

```tsx
interface WeeklyStripProps {
  currentDate?: Date
  daysData?: { date: string; status: DayStatus }[]
  className?: string
  // NUEVAS props (opcionales — retrocompatible):
  selectedDate?: string          // fecha activa controlada externamente
  onDaySelect?: (date: string) => void  // callback en lugar de navegar
}
```

**Lógica:** si `onDaySelect` está definido, el `<Link>` se reemplaza por un `<button>` que llama al callback. El día activo usa `selectedDate ?? todayStr`.

**Visual día activo:**
- Bg: `bg-white/[0.04]` + `border border-white/[0.07]` + `rounded-xl`
- Label día: `text-emerald-400` (entrenamiento) o `text-sky-400` (descanso)
- Círculo: `bg-emerald-500` + `ring-2 ring-offset-2 ring-white/20` + `shadow-[0_2px_8px] shadow-emerald-500/45`
- Número: `text-white font-bold`

**Visual por estado de círculo:**
| Status | Fill | Opacidad |
|---|---|---|
| `TODAY` | `emerald-500` | 100% + glow |
| `TODAY_REST` | `blue-400` | 100% + glow |
| `COMPLETED` | `emerald-500` | 100% |
| `REST` | `emerald-400` | 40% |
| `TRAINING` (futuro) | `emerald-500` | 20% |
| `PENDING` | `zinc-800` | 100% |
| `SKIPPED` | `red-500` | 70% |

---

### 2. `BackToTodayPill`

```tsx
// Mostrar solo cuando selectedDate !== today
// Posición: top-right del contenedor, absoluto o flex justify-end

<button className="flex items-center gap-1.5 px-3 py-1 rounded-full
  bg-emerald-500/12 border border-emerald-500/30
  text-emerald-400 text-xs font-medium
  hover:bg-emerald-500/20 transition-colors">
  ← Hoy
</button>
```

---

### 3. `MetricsPair`

```tsx
interface MetricsPairProps {
  streak: number
  sessionsThisMonth: number
  targetSessions: number  // default: 10
}
```

**Layout móvil:** `grid grid-cols-2 gap-3`
**Layout desktop:** `flex flex-col gap-4 h-full` (apiladas, altura completa)

**Card Racha:**
```
bg-zinc-900 border border-zinc-800 rounded-2xl p-4 (móvil) / p-5 (desktop)
🔥  →  text-xl (móvil) / text-2xl (desktop)
"12 días"  →  text-[22px] font-bold (móvil) / text-[34px] font-bold (desktop)
"Racha actual"  →  text-xs text-zinc-500
"Sigue así 💪"  →  text-[11px] text-zinc-500  ← solo desktop
```

**Card Hito:**
```
bg-zinc-900 border border-zinc-800 rounded-2xl
🎯  →  text-xl / text-2xl
"8 / 10"  →  text-[22px] font-bold / text-[34px] font-bold
"Sesiones del mes"  →  text-xs text-zinc-500
Progress bar: h-[3px] (móvil) / h-[4px] (desktop) bg-zinc-800 rounded-full
  └─ fill: w-[80%] bg-emerald-500 shadow-[0_0_4px_0] shadow-emerald-500/50
"2 sesiones para la meta"  →  text-[11px] text-zinc-500  ← solo desktop
```

---

### 4. `TrainingDayCard`

```tsx
interface TrainingDayCardProps {
  routine: RoutineWithExercises
  status: CompletionStatus | null
  isToday: boolean
  selectedDate: string
}
```

**Estructura:**
```
Card (rounded-2xl bg-zinc-900 border border-emerald-500/20
      shadow-[0_8px_40px_0] shadow-emerald-500/7)
│
├── Gradient wash: linear desde emerald-500/8 → transparent (parte superior)
│
├── Label: "SESIÓN DE HOY"  →  text-[10px] uppercase tracking-[2px] text-zinc-500
├── Título: routine.name  →  text-[28px] font-extrabold (móvil) / text-[38px] (web)
├── Detalles: "{n} ejercicios · RPE objetivo {rpe}"  →  text-[13px] text-zinc-500
├── Badge estado: pill zinc-800 text-zinc-400
│
├── [Solo desktop] Lista preview (3 ejercicios):
│   ├── divider zinc-800
│   └── Fila: barra-verde-4px | nombre | "3×10"
│
└── Botón INICIAR:
    href: isToday ? "/today" : "/training/session?date={selectedDate}"
    texto: isToday ? "▶  INICIAR ENTRENAMIENTO" : "Ver sesión"
    style: w-full bg-emerald-500 rounded-xl font-bold
           shadow-[0_6px_20px_0] shadow-emerald-500/38
           hover:bg-emerald-400 active:scale-[0.98] transition-all
```

**Badge estados:**
| CompletionStatus | Label | Color |
|---|---|---|
| `null` / `PENDING` | Sin iniciar | `zinc-800 / zinc-400` |
| `COMPLETED` | Completada ✓ | `emerald-500/15 / emerald-400` |
| `PARTIAL` | En progreso | `yellow-500/15 / yellow-400` |
| `SKIPPED` | Saltada | `red-500/15 / red-400` |

---

### 5. `RestDayCard`

```tsx
interface RestDayCardProps {
  isToday: boolean
  selectedDate: string
}
```

**Estructura:**
```
Card (rounded-2xl bg-zinc-900 border border-blue-500/20
      shadow-[0_8px_40px_0] shadow-blue-500/7)
│
├── Gradient wash: linear desde blue-500/8 → transparent
├── Label: "DESCANSO ACTIVO"  →  tracking-[2px] text-zinc-500
├── Emoji: 🌙  →  text-[32px] (móvil) / text-[44px] (web)
├── Título: "Tu cuerpo se recupera"  →  text-xl font-bold (móvil) / text-[28px] (web)
├── Sub: "La recuperación es parte del progreso."  →  text-sm text-zinc-500
│
└── [Solo si isToday] Botón sesión libre:
    href: "/today?free=true"
    texto: "+ Registrar sesión libre"
    style: w-full bg-blue-500/10 border border-blue-500/25
           text-sky-400 font-medium rounded-xl
           hover:bg-blue-500/20 transition-colors
```

**Frases motivacionales (rotar por día de semana):**
```ts
const REST_MESSAGES = [
  "Tu cuerpo se recupera",        // Dom
  "Hoy recargas energía",         // Lun (no debería darse en Fase Cero)
  "El descanso es entrenamiento", // Mar
  "Recuperación activa",          // Mié
  "Tu músculo crece en el reposo",// Jue
  "Descansa hoy, rinde mañana",   // Vie
  "Semana completada 🎯",         // Sáb
]
```

---

### 6. `OverviewDashboard` — orquestador

```tsx
"use client"

interface OverviewDashboardProps {
  initialDayData: TodayResponse
  weekDays: WeekDayData[]   // 7 días con routine + dailyLog
  streak: number
  sessionsThisMonth: number
}

export function OverviewDashboard({ initialDayData, weekDays, streak, sessionsThisMonth }: OverviewDashboardProps) {
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)

  // Lookup local — sin fetch
  const selectedDay = weekDays.find(d => d.date === selectedDate) ?? weekDays[0]
  const isToday = selectedDate === todayStr
  const isRest = !selectedDay?.routine

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8 max-w-6xl space-y-5 lg:space-y-6">
      <OverviewHeader date={selectedDate} isToday={isToday} />

      <div className="relative">
        <WeeklyStrip
          daysData={weekDays.map(...)}
          selectedDate={selectedDate}
          onDaySelect={setSelectedDate}
          className="-mx-5 lg:mx-0 lg:rounded-2xl"
        />
        {!isToday && (
          <div className="absolute top-3 right-3 lg:top-4 lg:right-4">
            <BackToTodayPill onClick={() => setSelectedDate(todayStr)} />
          </div>
        )}
      </div>

      {/* Layout: móvil apilado / desktop 2 columnas */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-5 lg:gap-6">
        {/* Col izquierda: card principal */}
        {isRest
          ? <RestDayCard isToday={isToday} selectedDate={selectedDate} />
          : <TrainingDayCard
              routine={selectedDay.routine}
              status={selectedDay.dailyLog?.status ?? null}
              isToday={isToday}
              selectedDate={selectedDate}
            />
        }

        {/* Col derecha: métricas (en móvil van ANTES del card) */}
        <div className="lg:order-none order-first">
          <MetricsPair
            streak={streak}
            sessionsThisMonth={sessionsThisMonth}
            targetSessions={10}
          />
        </div>
      </div>

      {/* Placeholder nutrición */}
      <div className="border border-dashed border-zinc-800 rounded-xl h-14 flex items-center justify-center">
        <span className="text-xs text-zinc-700">+ Nutrición · Próximamente</span>
      </div>
    </div>
  )
}
```

> **Nota sobre orden en móvil:** Las métricas van arriba del card principal en móvil (como en el diseño de Figma). Con `order-first` en la col de métricas dentro del grid.

---

### 7. `app/(app)/page.tsx` — Server Component

```tsx
import { OverviewDashboard } from "@/features/session/components/overview-dashboard"

export default async function OverviewPage() {
  const user = await getRequiredSession()

  const [todayData, weekData, progressData] = await Promise.all([
    sessionRepo.getTodayData(user.id),
    trainingRepo.getWeekData(user.id, new Date()),
    progressRepo.getProgressData(user.id),
  ])

  return (
    <OverviewDashboard
      initialDayData={todayData}
      weekDays={weekData.days}
      streak={progressData.stats.streak}
      sessionsThisMonth={progressData.stats.sessionsThisMonth}
    />
  )
}
```

---

## Tipo de dato necesario

```ts
// Nuevo tipo para los días de la semana en el overview
interface WeekDayData {
  date: string                          // "2026-03-30"
  isRest: boolean
  routine: RoutineWithExercises | null
  dailyLog: {
    status: CompletionStatus
  } | null
}
```

Este tipo ya existe implícitamente en `WeekData.days` del training repo. Solo necesita re-exportarse o reutilizarse.

---

## Orden de implementación

1. **Modificar `WeeklyStrip`** — añadir `onDaySelect` + `selectedDate` props. Es la base de todo.
2. **Crear `BackToTodayPill`** — componente trivial.
3. **Crear `MetricsPair`** — dos cards simples, sin lógica.
4. **Crear `TrainingDayCard`** — incluye lógica de badge de estado.
5. **Crear `RestDayCard`** — incluye array de frases por día de semana.
6. **Crear `OverviewDashboard`** — orquestador con estado `selectedDate`.
7. **Actualizar `app/(app)/page.tsx`** — fetch de datos + pasar props.

---

## Consideraciones de responsividad

| Elemento | Móvil | Desktop (lg:) |
|---|---|---|
| Padding página | `px-5 py-6` | `px-10 py-8` |
| Greeting size | `text-[26px]` | `text-[30px]` |
| Grid layout | 1 columna | `grid-cols-[1fr_320px]` |
| Orden métricas | primero (order-first) | segundo (derecha) |
| Card padding | `p-5` | `p-7` |
| Nombre rutina | `text-[28px]` | `text-[38px]` |
| Lista ejercicios | oculta | visible |
| Botón INICIAR height | `h-[54px]` | `h-[56px]` |
| Métricas layout | `grid-cols-2` | `flex-col` |
| Valor métrica | `text-[22px]` | `text-[34px]` |
| Sub-texto métricas | oculto | visible |

---

## Notas finales

- **Sin fetch al cambiar día** — los 7 días de la semana vienen del Server Component como props. El cambio de día es un lookup en array local, instantáneo.
- **WeeklyStrip retrocompatible** — el componente en `/training` sigue usando navegación normal (sin `onDaySelect`).
- **Sidebar desktop** — ya existe en `components/layout/sidebar.tsx`, no se modifica.
- **Espacio nutrición** — solo un div con borde dashed y texto placeholder, sin lógica.
- **PWA ready** — el layout sigue siendo mobile-first con `pb-20 lg:pb-0` del layout padre.
