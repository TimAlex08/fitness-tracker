@AGENTS.md

# Proyecto: App de Gestión de Rutina de Ejercicios

## Stack
- **Framework:** Next.js 14+ (App Router)
- **ORM:** Prisma
- **DB:** SQLite (dev) → PostgreSQL (prod)
- **UI:** Tailwind CSS + shadcn/ui
- **Filosofía:** Registrar datos reales desde el Día 1. La app crece contigo, no al revés.

## Estructura del Proyecto
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx               # Dashboard: resumen del día
│   ├── today/page.tsx         # ★ VISTA PRINCIPAL: sesión de hoy
│   ├── exercises/
│   │   ├── page.tsx           # Catálogo de ejercicios
│   │   └── [id]/page.tsx      # Detalle + historial del ejercicio
│   ├── log/
│   │   ├── page.tsx           # Historial de registros
│   │   └── [date]/page.tsx    # Registro de un día específico
│   ├── progress/page.tsx      # Gráficas y métricas
│   ├── program/page.tsx       # Ver/editar programa actual
│   └── api/
│       ├── exercises/route.ts
│       ├── daily-log/route.ts
│       ├── exercise-log/route.ts
│       └── measurements/route.ts
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── exercise-card.tsx
│   ├── set-tracker.tsx        # ★ Widget para registrar sets en vivo
│   ├── timer.tsx              # Cronómetro de descanso
│   ├── daily-checklist.tsx
│   ├── rpe-selector.tsx
│   ├── pain-indicator.tsx
│   ├── streak-counter.tsx
│   └── progress-chart.tsx
├── lib/
│   ├── prisma.ts              # Singleton de PrismaClient
│   ├── utils.ts
│   └── exercise-data.ts
└── types/index.ts
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

## Modelos de Base de Datos (Prisma)

### Modelos principales
- **Exercise** — Catálogo maestro de ejercicios. Incluye clasificación (muscleGroup, movementType, category), parámetros por defecto (sets, reps, tempo, RPE, descanso), metadata de seguridad (jointStress, targetJoints, contraindications), y relaciones de progresión/regresión (parentId → variants).
- **Program** → **Phase** → **Routine** → **RoutineExercise** — Jerarquía del plan de entrenamiento.
- **DailyLog** — Registro diario: fecha, rutina ejecutada, estado (PENDING/COMPLETED/PARTIAL/SKIPPED), RPE general, sueño, energía, peso, notas de dolor.
- **ExerciseLog** — Lo que realmente se hizo: reps por serie (JSON array), RPE real, calidad de forma, dolor durante ejecución, si se usó regresión.
- **BodyMeasurement** — Mediciones corporales periódicas.

### Enums clave
- `MuscleGroup`: CHEST, BACK, LEGS, SHOULDERS, CORE, MOBILITY, FULL_BODY
- `MovementType`: PUSH, PULL, SQUAT, HINGE, CARRY, ISOMETRIC, MOBILITY, ACTIVATION
- `ExerciseCategory`: STANDARD, REGRESSION, PROGRESSION, PREHAB, WARMUP, COOLDOWN
- `JointStress`: NONE, LOW, MODERATE, HIGH
- `SessionType`: TRAINING, MOBILITY, REST, DELOAD
- `CompletionStatus`: PENDING, COMPLETED, PARTIAL, SKIPPED
- `FormQuality`: PERFECT, GOOD, FAIR, POOR

## Variables Críticas a Trackear
| Variable | Campo | Por qué importa |
|---|---|---|
| Reps por serie | `ExerciseLog.repsPerSet` (JSON) | Detectar cuándo subir progresión |
| RPE real vs objetivo | `ExerciseLog.rpeActual` | Evitar sobre/sub-entrenamiento |
| Dolor durante ejercicio | `ExerciseLog.painDuring` | Alerta temprana de lesión |
| Calidad de forma | `ExerciseLog.formQuality` | No avanzar con técnica pobre |
| ¿Usó regresión? | `ExerciseLog.usedRegression` | Tracking honesto de capacidad real |
| Horas de sueño | `DailyLog.sleepHours` | Correlacionar con rendimiento |

## Plan de Sprints

### Sprint 1 — MVP: "Puedo registrar mi sesión de hoy"
- Página `/today`: fecha, sesión del día, checklist de ejercicios con series
- API routes mínimas: GET rutina del día, POST registro ejercicio, POST daily log

### Sprint 2 — Registro detallado: "Guardo variables reales"
- Widget `set-tracker`: reps, RPE, dolor, regresión, calidad de forma por serie
- Timer de descanso al completar serie
- Resumen post-sesión (RPE global, sueño, energía, peso)
- Página `/log` con historial y calendario

### Sprint 3 — Catálogo y programa: "Veo mi plan completo"
- Páginas `/exercises` y `/exercises/[id]` con filtros, variantes e historial
- Página `/program` con fases y benchmarks
- CRUD de ejercicios

### Sprint 4 — Progreso: "Veo mi avance"
- Dashboard `/progress`: streak, volumen semanal, progresión por ejercicio, dolor promedio
- Indicadores de benchmark por fase
- Exportar datos CSV/JSON

### Sprint 5 — Polish: "La app es un placer de usar"
- PWA (offline, instalable en celular)
- Dark mode
- Notificaciones/recordatorios
- Animaciones en completar ejercicios

## Contexto del Programa de Entrenamiento
- **Fase Cero (Integridad Estructural):** Ejercicios de baja carga articular, movilidad diaria, activación. Sesiones: Full Body A (Lun/Mié/Vie) + Movilidad Diaria.
- Los ejercicios tienen jerarquía de regresión → estándar → progresión (ej: Flexiones en pared → Flexiones inclinadas → Flexiones estándar).
- Cada sesión incluye: calentamiento, bloque principal, vuelta a la calma.
- RPE objetivo Fase Cero: 6-7. Tempo por defecto: 2-1-2-0.
