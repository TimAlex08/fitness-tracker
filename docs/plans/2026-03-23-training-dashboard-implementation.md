# Training Dashboard — Implementation Plan
**Date:** 2026-03-23
**Design doc:** `docs/plans/2026-03-23-training-dashboard-design.md`

---

## Sprint A — APIs de datos históricos

### A.1 GET /api/training/week
- Archivo: `app/api/training/week/route.ts`
- Query param: `date=YYYY-MM-DD` (default: today)
- Calcular lunes de la semana que contiene `date`
- Para cada uno de los 7 días:
  - Buscar Routine asignada al día de semana en el Program activo → Phase activa
  - Buscar DailyLog con esa fecha
  - Si no hay Routine → marcar `isRest: true`
- Retornar array de 7 objetos:
  ```ts
  { date, dayOfWeek, isToday, isRest,
    routine: { id, name, exerciseCount, estimatedDuration, rpeTarget } | null,
    dailyLog: { status, rpeActual, durationMin, exercisesCompleted } | null }
  ```

### A.2 GET /api/training/month
- Archivo: `app/api/training/month/route.ts`
- Query params: `year`, `month`
- Para cada día del mes:
  - Buscar DailyLog (status)
  - Si no hay Routine asignada → `isRest: true`, `status: REST`
- Retornar array de días:
  ```ts
  { date, status, isRest }
  ```
- Incluir métrica pre-calculada: `streak` (racha actual), `adherence` (completados+descanso / días pasados)

### A.3 GET /api/training/year
- Archivo: `app/api/training/year/route.ts`
- Query param: `year`
- Payload mínimo (heatmap no necesita más):
  ```ts
  { date, status, isRest }[]
  ```
- Incluir: `totalSessions`, `currentStreak`, `maxStreak`

---

## Sprint B — Pantalla /training y vista semanal

### B.1 Mover /today → /training/session
- Mover `app/(app)/today/` → `app/(app)/training/session/`
- Actualizar cualquier link interno que apunte a `/today`
- Verificar que todos los imports y referencias funcionen

### B.2 Server Component /training/page.tsx
- Archivo: `app/(app)/training/page.tsx`
- Fetch `GET /api/training/week` con la fecha actual
- Pasar datos a `<TrainingDashboard weekData={...} />`

### B.3 Componente TrainingDashboard (Client)
- Archivo: `components/training/training-dashboard.tsx`
- Estado: `view: 'week' | 'month' | 'year'`
- Selector de vista: tabs o toggle [Sem | Mes | Año]
- Lazy fetch de mes/año al cambiar vista (fetch una sola vez, cachear en estado)
- Renderiza `<WeekView>`, `<MonthView>` o `<YearView>` según estado

### B.4 Componente WeekView
- Archivo: `components/training/week-view.tsx`
- Props: `days: WeekDay[]`
- Header: número de semana + mes/año
- Card grande para el día de hoy (`isToday: true`)
  - Nombre rutina, ejercicios, duración estimada, RPE objetivo
  - Si `dailyLog.status === COMPLETED`: mostrar RPE real + duración real
  - Si `dailyLog` existe pero no completado: mostrar progreso parcial
  - Botón "Iniciar sesión →" → `href="/training/session"`
- Cards compactos para los demás días
  - Nombre rutina o "Descanso"
  - Ícono de estado
  - Dato clave si completado

### B.5 Actualizar navegación
- Cambiar link de sidebar/bottom nav de `/today` → `/training`
- Actualizar `app/(app)/layout.tsx` o el componente de navegación

---

## Sprint C — Vista Mensual

### C.1 Componente MonthView
- Archivo: `components/training/month-view.tsx`
- Props: `days: MonthDay[], year: number, month: number`
- Header: nombre del mes + año + flechas `← →` (cambian `month` en estado del padre)
- Barra de métricas: racha actual 🔥, días completados/total, adherencia %
- Grid de calendario: 7 columnas (Lun–Dom)
- Celda por día: círculo con color según status

### C.2 Lógica "Don't Break the Chain"
- En `MonthView`, calcular secuencias consecutivas de días `COMPLETED | isRest`
- Para cada celda en una secuencia, renderizar conector horizontal (banda CSS)
  - Izquierda: si el día anterior es parte de la cadena
  - Derecha: si el día siguiente es parte de la cadena
- Al romper cadena (SKIPPED): no renderizar conector

### C.3 Colores y estilos
- COMPLETED / isRest → `bg-green-500` / `bg-green-300`
- PARTIAL → `bg-yellow-400`
- SKIPPED → `bg-red-400`
- Futuro / sin datos → `border border-gray-300`
- Hoy → ring: `ring-2 ring-offset-2 ring-primary`

---

## Sprint D — Vista Anual (Heatmap)

### D.1 Componente YearView
- Archivo: `components/training/year-view.tsx`
- Props: `days: YearDay[], year: number, totalSessions: number, currentStreak: number, maxStreak: number`
- Header: año + métricas (total sesiones, racha actual, racha máxima)
- Grid: columnas = semanas del año (52–53), filas = días de semana (7)
- Labels de mes encima del grid (posición calculada por semana de inicio de cada mes)

### D.2 Celda del heatmap
- Tamaño: ~12px × 12px con gap de 2px
- Mismo sistema de colores que MonthView
- Tooltip en hover: fecha, nombre de rutina, RPE + duración si completado
- Implementar tooltip con `title` attr o componente Tooltip de shadcn/ui

### D.3 Generación del grid
- Función utilitaria `buildYearGrid(days: YearDay[], year: number)` en `lib/training.ts`
- Retorna array de 52–53 semanas, cada semana con 7 celdas
- Celdas vacías para días antes del 1 de enero y después del 31 de diciembre

---

## Sprint E — Lib y tipos

### E.1 lib/training.ts
- `getWeekData(date: Date)` → datos para A.1
- `getMonthData(year: number, month: number)` → datos para A.2
- `getYearData(year: number)` → datos para A.3
- `calculateStreak(days: { date: Date, status: string, isRest: boolean }[])` → número
- `buildYearGrid(days: YearDay[], year: number)` → matriz de semanas

### E.2 types/training.ts
```ts
type DayStatus = 'COMPLETED' | 'PARTIAL' | 'SKIPPED' | 'PENDING' | 'REST'

interface WeekDay {
  date: string          // ISO YYYY-MM-DD
  dayOfWeek: number     // 0 = Monday
  isToday: boolean
  isRest: boolean
  routine: { id: string; name: string; exerciseCount: number; estimatedDuration: number; rpeTarget: string } | null
  dailyLog: { status: DayStatus; rpeActual: number | null; durationMin: number | null; exercisesCompleted: number } | null
}

interface MonthDay {
  date: string
  status: DayStatus
  isRest: boolean
}

interface YearDay {
  date: string
  status: DayStatus
  isRest: boolean
}

interface YearSummary {
  totalSessions: number
  currentStreak: number
  maxStreak: number
}
```

---

## Orden de implementación sugerido

1. **E** — tipos y lib primero (foundation)
2. **A** — APIs (A.1, A.2, A.3)
3. **B** — ruta `/training` + vista semanal (más usada, valor inmediato)
4. **C** — vista mensual
5. **D** — vista anual (heatmap)

---

## Archivos a crear

```
app/(app)/training/
├── page.tsx
└── session/
    └── page.tsx          ← mover desde app/(app)/today/page.tsx

app/api/training/
├── week/route.ts
├── month/route.ts
└── year/route.ts

components/training/
├── training-dashboard.tsx
├── week-view.tsx
├── month-view.tsx
├── year-view.tsx
└── day-cell.tsx          ← celda reutilizable (mes y año comparten lógica)

lib/training.ts
types/training.ts
```

## Archivos a modificar

```
app/(app)/layout.tsx           ← actualizar nav link /today → /training
components/ui/sidebar.tsx      ← (si existe) actualizar link
```
