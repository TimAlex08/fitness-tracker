# Vista General — Overview Dashboard

**Fecha:** 2026-03-30
**Ruta:** `app/(app)/page.tsx` (reemplaza dashboard actual)
**Estado:** Aprobado, pendiente de implementación

---

## Objetivo

Rediseñar el home (`/`) para que sea la pantalla central de la app. El usuario debe saber al instante qué entrena hoy sin pensar. Limpia y extensible para añadir nutrición en el futuro.

---

## Layout (móvil primero, scroll vertical)

```
┌─────────────────────────────────┐
│  Lunes · 30 de marzo            │  ← fecha pequeña (text-zinc-500)
│  Buenos días 💪                 │  ← saludo bold grande (text-2xl font-bold)
├─────────────────────────────────┤
│  [Dom][Lun][Már][Mié][Jue][Vie][Sáb]  │  ← WeeklyStrip (existente)
│       ↑ hoy destacado                  │
│                  [← Hoy] pill si ≠ hoy │
├─────────────────────────────────┤
│  🔥 12 días     🎯 8/10 sesiones│  ← MetricsPair (2 métricas grandes)
├─────────────────────────────────┤
│  ┌─── CARD PRINCIPAL ─────────┐ │
│  │ Full Body A                │ │  ← TrainingDayCard o RestDayCard
│  │ 8 ejercicios · RPE 6-7    │ │
│  │  [▶ INICIAR ENTRENAMIENTO] │ │
│  └────────────────────────────┘ │
│                                  │
│  [zona nutrición — futuro]       │
└─────────────────────────────────┘
```

---

## Paleta visual

| Elemento | Token |
|---|---|
| Fondo | `zinc-950` |
| Día activo strip | ring blanco + label `emerald-400` |
| Card entrenamiento | borde `emerald-500/30`, glow verde sutil |
| Card descanso | borde `blue-500/30`, glow azul/púrpura |
| Métricas | `text-3xl font-bold text-white` |
| Fecha | `text-sm text-zinc-500` |

---

## Árbol de componentes

```
app/(app)/page.tsx                         ← Server Component
└── <OverviewDashboard>                    ← Client Component (NUEVO)
     ├── <OverviewHeader>                  ← nuevo (fecha + saludo)
     ├── <WeeklyStrip onDaySelect={...}>  ← existente + prop nueva
     ├── <BackToTodayPill>                ← nuevo (condicional)
     ├── <MetricsPair>                    ← nuevo (racha + hito)
     └── <TrainingDayCard> | <RestDayCard> ← nuevos
```

### Nuevos archivos

| Archivo | Tipo | Descripción |
|---|---|---|
| `features/session/components/overview-dashboard.tsx` | Client | Orquestador principal, maneja `selectedDate` |
| `features/session/components/overview-header.tsx` | Client | Fecha formateada + saludo |
| `features/session/components/metrics-pair.tsx` | Client | Racha + próximo hito |
| `features/session/components/training-day-card.tsx` | Client | Card de rutina con botón iniciar |
| `features/session/components/rest-day-card.tsx` | Client | Card de descanso motivacional |
| `features/session/components/back-to-today-pill.tsx` | Client | Badge/pill "← Hoy" condicional |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `app/(app)/page.tsx` | Reemplazar contenido actual por `<OverviewDashboard>` |
| `features/training/components/weekly-strip.tsx` | Añadir prop opcional `onDaySelect?: (date: string) => void` |

---

## Estado del Client Component

```ts
// OverviewDashboard
const [selectedDate, setSelectedDate] = useState<string>(todayStr)
const [selectedDayData, setSelectedDayData] = useState(initialDayData)

// Al cambiar día: lookup local en weekDays[] — sin fetch adicional
const selectedDayData = weekDays.find(d => d.date === selectedDate)
const isToday = selectedDate === todayStr
const isRest = !selectedDayData?.routine
```

---

## Flujo de datos

```
Server Component (page.tsx)
  ├── sessionRepo.getTodayData(userId)      → todayData
  ├── progressRepo.getProgressData(userId) → streak
  └── trainingRepo.getWeekData(userId)     → weekDays[7] (routine + dailyLog cada día)

↓ props al Client Component

Usuario toca un día del strip
  └── setSelectedDate(date)
      └── lookup instantáneo en weekDays[]
          └── re-render sin red (datos pre-cargados)
```

---

## Componentes: comportamiento

### TrainingDayCard
- Nombre de rutina (`text-xl font-bold`)
- `{n} ejercicios · RPE {objetivo}`
- Badge de estado: Pendiente / En progreso / Completada / Sin iniciar
- Botón primario:
  - Si `isToday` → `href="/today"` — "Iniciar entrenamiento"
  - Si otro día → `href="/training/session?date={date}"` — "Ver sesión"

### RestDayCard
- Ícono luna/recuperación con glow azul
- Mensaje motivacional (array de 4 frases, rotación por día de la semana)
- Botón secundario: "Registrar sesión libre" → `/today?free=true`
- Solo muestra el botón si `isToday`

### MetricsPair
- **Racha:** `🔥 {streak} días` — si streak=0: "Empieza hoy"
- **Próximo hito:** `🎯 {sessionsThisMonth}/10 sesiones` — barra mini de progreso
- Al llegar a 10: "¡Meta del mes! 🎯"

### WeeklyStrip (modificación)
```ts
// Prop nueva, retrocompatible
onDaySelect?: (date: string) => void

// Lógica: si existe onDaySelect, no navega — llama al callback
onClick={onDaySelect ? () => onDaySelect(dateStr) : undefined}
// El Link se convierte en div cuando hay onDaySelect
```

---

## Espacio para nutrición (futuro)

Debajo del `DayCard` se deja una sección vacía marcada con comentario:

```tsx
{/* ── Nutrición ── */}
{/* TODO Sprint N: NutritionSummaryCard */}
```

Sin lógica, sin imports — solo el placeholder visual.

---

## Decisiones tomadas

| Decisión | Razón |
|---|---|
| Sin fetch al cambiar día | Los 7 días de la semana se pre-cargan en el server, lookup local instantáneo |
| Solo 2 métricas | Limpio, extensible, no satura al usuario |
| RestDayCard motivacional con sesión libre | Día de descanso no = inactividad total; flexibilidad sin presión |
| WeeklyStrip retrocompatible | No rompe `/training` que ya la usa con navegación |
| Nuevos componentes en `features/session/` | El dashboard es la vista de "sesión del día" ampliada |
