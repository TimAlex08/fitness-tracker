# Plan de Desarrollo: App de Gestión de Rutina de Ejercicios

**Stack:** Next.js 14+ (App Router) · Prisma ORM · SQLite (dev) → PostgreSQL (prod) · Tailwind CSS · shadcn/ui
**Filosofía:** Registrar datos reales desde el Día 1. La app crece contigo, no al revés.

---

## Arquitectura de Base de Datos (Prisma Schema)

Este esquema captura todas las variables relevantes de tu plan de entrenamiento táctico. Está diseñado para escalar hacia una app de gestión personal completa.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"    // Cambiar a "postgresql" en producción
  url      = env("DATABASE_URL")
}

// ============================================
// CATÁLOGO DE EJERCICIOS
// ============================================

model Exercise {
  id          String   @id @default(cuid())
  name        String                          // "Flexiones en pared"
  slug        String   @unique                // "flexiones-en-pared"
  description String?                         // Descripción técnica / cues
  imageUrl    String?                         // Ruta a imagen o URL
  videoUrl    String?                         // Link a video demostrativo

  // Clasificación
  muscleGroup   MuscleGroup                   // CHEST, BACK, LEGS, SHOULDERS, CORE, MOBILITY
  movementType  MovementType                  // PUSH, PULL, SQUAT, HINGE, CARRY, ISOMETRIC, MOBILITY
  category      ExerciseCategory              // STANDARD, REGRESSION, PROGRESSION, PREHAB
  difficulty    Int        @default(1)        // 1-10 escala de dificultad

  // Relación de progresión/regresión
  parentId      String?                       // Ejercicio "padre" del que deriva
  parent        Exercise?  @relation("ExerciseVariants", fields: [parentId], references: [id])
  variants      Exercise[] @relation("ExerciseVariants")

  // Parámetros por defecto
  defaultSets         Int?                    // Series sugeridas
  defaultReps         Int?                    // Repeticiones sugeridas (null si isométrico)
  defaultDurationSec  Int?                    // Duración en segundos (para isométricos/holds)
  defaultRestSec      Int      @default(60)   // Descanso entre series
  defaultTempo        String?                 // "2-1-2-0" (excéntrica-pausa-concéntrica-pausa)
  defaultRpe          Int?                    // RPE objetivo (1-10)

  // Metadata de seguridad (clave para tu perfil)
  jointStress         JointStress @default(LOW)    // LOW, MODERATE, HIGH
  targetJoints        String?                      // "rodillas,lumbares" - articulaciones comprometidas
  contraindications   String?                      // "Evitar si dolor en hombro anterior"
  safetyNotes         String?                      // "Mantener tibias verticales"

  // Carga estimada (para peso corporal)
  bodyweightPercent   Float?                  // % del peso corporal que se mueve (ej: 0.64 para push-up)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  routineExercises  RoutineExercise[]
  exerciseLogs      ExerciseLog[]

  @@index([muscleGroup])
  @@index([category])
  @@index([parentId])
}

// ============================================
// PROGRAMA / PLAN DE ENTRENAMIENTO
// ============================================

model Program {
  id          String   @id @default(cuid())
  name        String                          // "Plan Táctico 0 a 100"
  description String?
  isActive    Boolean  @default(true)         // Solo 1 programa activo a la vez

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  phases      Phase[]
}

model Phase {
  id          String   @id @default(cuid())
  programId   String
  program     Program  @relation(fields: [programId], references: [id], onDelete: Cascade)

  name        String                          // "Fase Cero: Integridad Estructural"
  order       Int                             // 0, 1, 2 para ordenar fases
  weekStart   Int                             // Semana de inicio (1, 5, 9...)
  weekEnd     Int                             // Semana de fin (4, 8, 16...)
  description String?
  rpeTarget   String?                         // "6-7" RPE objetivo de la fase
  tempoDefault String?                        // "2-1-2-0" tempo por defecto

  // Benchmarks para avanzar
  benchmarks  String?                         // JSON con criterios de avance

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  routines    Routine[]
}

model Routine {
  id          String   @id @default(cuid())
  phaseId     String
  phase       Phase    @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  name        String                          // "Sesión Full Body A", "Movilidad Diaria"
  dayOfWeek   String?                         // "monday,wednesday,friday" o "daily"
  sessionType SessionType                     // TRAINING, MOBILITY, REST, DELOAD
  durationMin Int?                            // Duración estimada en minutos
  description String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  exercises   RoutineExercise[]
  dailyLogs   DailyLog[]
}

model RoutineExercise {
  id          String   @id @default(cuid())
  routineId   String
  routine     Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exerciseId  String
  exercise    Exercise @relation(fields: [exerciseId], references: [id])

  order       Int                             // Orden dentro de la rutina
  block       String?                         // "warmup", "main", "cooldown"

  // Override de parámetros (si difiere del default del ejercicio)
  sets        Int?
  reps        Int?
  durationSec Int?
  restSec     Int?
  tempo       String?
  rpe         Int?
  notes       String?                         // "Retención 3s arriba"

  createdAt   DateTime @default(now())

  @@unique([routineId, exerciseId, order])
  @@index([routineId])
}

// ============================================
// REGISTRO DIARIO (EL DÍA A DÍA)
// ============================================

model DailyLog {
  id          String   @id @default(cuid())
  date        DateTime                        // Fecha del registro (solo fecha, sin hora)
  routineId   String?                         // Qué rutina se ejecutó (null si día libre)
  routine     Routine? @relation(fields: [routineId], references: [id])

  // Estado de cumplimiento
  status      CompletionStatus @default(PENDING)  // PENDING, COMPLETED, PARTIAL, SKIPPED
  startedAt   DateTime?                       // Hora de inicio real
  finishedAt  DateTime?                       // Hora de fin real
  durationMin Int?                            // Duración real en minutos

  // Percepción subjetiva
  overallRpe    Int?                          // RPE general de la sesión (1-10)
  energyLevel   Int?                          // Nivel de energía pre-sesión (1-5)
  sleepHours    Float?                        // Horas dormidas la noche anterior
  sleepQuality  Int?                          // Calidad del sueño (1-5)
  bodyWeight    Float?                        // Peso del día (kg) — tracking opcional
  mood          Int?                          // Estado de ánimo (1-5)

  // Dolor / molestias
  painNotes     String?                       // "Leve molestia rodilla derecha al bajar"
  painLevel     Int?                          // 0-10 escala de dolor

  // Notas generales
  notes         String?                       // Observaciones libres del día

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  exerciseLogs  ExerciseLog[]

  @@unique([date, routineId])
  @@index([date])
  @@index([status])
}

model ExerciseLog {
  id            String   @id @default(cuid())
  dailyLogId    String
  dailyLog      DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)
  exerciseId    String
  exercise      Exercise @relation(fields: [exerciseId], references: [id])

  // Qué se ejecutó realmente
  completed     Boolean  @default(false)
  setsCompleted Int?                          // Series completadas
  repsPerSet    String?                       // JSON array: [12, 10, 8] reps por serie
  durationSec   Int?                          // Segundos totales (para isométricos)
  holdTimeSec   String?                       // JSON array: [30, 25, 20] segundos por hold

  // Calidad de ejecución
  rpeActual     Int?                          // RPE real (1-10)
  formQuality   FormQuality?                  // PERFECT, GOOD, FAIR, POOR
  painDuring    Int?                          // Dolor durante ejecución (0-5)

  // Progresión tracking
  usedRegression  Boolean @default(false)     // ¿Tuvo que usar regresión?
  regressionNote  String?                     // "Cambié a flexiones inclinadas en serie 3"

  notes         String?                       // Notas específicas del ejercicio

  createdAt     DateTime @default(now())

  @@index([dailyLogId])
  @@index([exerciseId])
  @@index([createdAt])
}

// ============================================
// MÉTRICAS Y MEDICIONES CORPORALES
// ============================================

model BodyMeasurement {
  id          String   @id @default(cuid())
  date        DateTime
  weight      Float?                          // kg
  waistCm     Float?                          // Circunferencia cintura
  hipCm       Float?                          // Circunferencia cadera
  chestCm     Float?                          // Circunferencia pecho
  armCm       Float?                          // Circunferencia brazo
  thighCm     Float?                          // Circunferencia muslo
  notes       String?
  photoUrl    String?                         // Foto de progreso

  createdAt   DateTime @default(now())

  @@index([date])
}

// ============================================
// ENUMS
// ============================================

enum MuscleGroup {
  CHEST
  BACK
  LEGS
  SHOULDERS
  CORE
  MOBILITY       // Categoría prioritaria: postura y movilidad
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
  ACTIVATION     // Ejercicios de activación (glúteos, etc.)
}

enum ExerciseCategory {
  STANDARD
  REGRESSION
  PROGRESSION
  PREHAB         // Prehabilitación / correctivo
  WARMUP
  COOLDOWN
}

enum JointStress {
  NONE           // Movilidad pura
  LOW            // Flexiones en pared, puentes
  MODERATE       // Flexiones inclinadas, sentadilla asistida
  HIGH           // Flexiones completas, sentadilla profunda
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
```

---

## Estructura del Proyecto

```
fitness-tracker/
├── prisma/
│   ├── schema.prisma              # Schema arriba
│   ├── seed.ts                    # Seed con TUS ejercicios reales
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout principal
│   │   ├── page.tsx               # Dashboard: resumen del día
│   │   ├── exercises/
│   │   │   ├── page.tsx           # Catálogo de ejercicios
│   │   │   └── [id]/page.tsx      # Detalle + historial del ejercicio
│   │   ├── today/
│   │   │   └── page.tsx           # ★ VISTA PRINCIPAL: sesión de hoy
│   │   ├── log/
│   │   │   ├── page.tsx           # Historial de registros
│   │   │   └── [date]/page.tsx    # Registro de un día específico
│   │   ├── progress/
│   │   │   └── page.tsx           # Gráficas y métricas
│   │   ├── program/
│   │   │   └── page.tsx           # Ver/editar programa actual
│   │   └── api/
│   │       ├── exercises/route.ts
│   │       ├── daily-log/route.ts
│   │       ├── exercise-log/route.ts
│   │       └── measurements/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── exercise-card.tsx      # Tarjeta de ejercicio
│   │   ├── set-tracker.tsx        # ★ Widget para registrar sets en vivo
│   │   ├── timer.tsx              # Cronómetro de descanso
│   │   ├── daily-checklist.tsx    # Checklist de ejercicios del día
│   │   ├── rpe-selector.tsx       # Selector de RPE (1-10)
│   │   ├── pain-indicator.tsx     # Indicador de dolor
│   │   ├── streak-counter.tsx     # Racha de días cumplidos
│   │   └── progress-chart.tsx     # Gráficas de progreso
│   ├── lib/
│   │   ├── prisma.ts              # Singleton de PrismaClient
│   │   ├── utils.ts               # Utilidades
│   │   └── exercise-data.ts       # Datos iniciales de ejercicios
│   └── types/
│       └── index.ts
├── public/
│   └── exercises/                 # Imágenes de ejercicios
├── .env
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Datos Seed: Tus ejercicios reales de Fase Cero

```typescript
// prisma/seed.ts (extracto - los ejercicios de tu Fase Cero)

const exercisesSeed = [
  // === MOVILIDAD DIARIA ===
  {
    name: "Cat-Cow",
    slug: "cat-cow",
    description:
      "En cuadrupedia, alternar flexión/extensión de columna. Iniciar movimiento desde región torácica. Retención 3s en cada extremo.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 12,
    defaultSets: 1,
    jointStress: "NONE",
    safetyNotes:
      "Movimiento lento y controlado. No forzar la extensión lumbar.",
  },
  {
    name: "Thread the Needle",
    slug: "thread-the-needle",
    description:
      "En cuadrupedia, pasar brazo por debajo del cuerpo hasta apoyar hombro en el suelo. Retención 5-10s.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 8,
    defaultSets: 1,
    jointStress: "NONE",
  },
  {
    name: "Book Opener",
    slug: "book-opener",
    description:
      "Acostado de lado, rodillas a 90°, rotar brazo superior hacia el techo abriendo pecho. Retención 3-5s.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 6,
    defaultSets: 1,
    jointStress: "NONE",
  },
  {
    name: "Estiramiento flexor de cadera arrodillado",
    slug: "estiramiento-flexor-cadera",
    description:
      "Media rodilla, apretar glúteos, bascular pelvis hacia atrás. Avanzar suavemente hasta sentir estiramiento en la cadera.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 1,
    defaultDurationSec: 30,
    defaultSets: 2,
    jointStress: "LOW",
  },
  {
    name: "90/90 Hip Switches",
    slug: "hip-switches-90-90",
    description:
      "Sentado, rodillas flexionadas, pies anchos. Dejar caer rodillas a un lado (ambas a 90°). Alternar + retención 30s cada lado.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 2,
    defaultReps: 8,
    defaultSets: 1,
    jointStress: "LOW",
  },
  {
    name: "Chin Tucks",
    slug: "chin-tucks",
    description:
      "Retraer mentón creando 'doble papada'. Retención 5s. Realizar 5 veces al día en trabajo sedentario.",
    muscleGroup: "MOBILITY",
    movementType: "ISOMETRIC",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 10,
    defaultSets: 1,
    defaultDurationSec: 5,
    jointStress: "NONE",
  },
  {
    name: "Retracciones escapulares",
    slug: "retracciones-escapulares",
    description:
      "De pie, juntar omóplatos hacia atrás y abajo. Retención 3-5s.",
    muscleGroup: "BACK",
    movementType: "ACTIVATION",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 15,
    defaultSets: 1,
    defaultDurationSec: 3,
    jointStress: "NONE",
  },
  {
    name: "Basculación pélvica posterior",
    slug: "basculacion-pelvica-posterior",
    description:
      "De pie, 'meter el coxis' contrayendo abdominales y glúteos. Retención 5s.",
    muscleGroup: "CORE",
    movementType: "ACTIVATION",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 10,
    defaultSets: 1,
    defaultDurationSec: 5,
    jointStress: "NONE",
  },
  {
    name: "Child's Pose",
    slug: "childs-pose",
    description:
      "Arrodillarse, sentarse sobre talones, extender brazos adelante. Respirar profundo.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "COOLDOWN",
    difficulty: 1,
    defaultDurationSec: 45,
    defaultSets: 1,
    jointStress: "NONE",
  },

  // === CALENTAMIENTO ===
  {
    name: "Marcha en el sitio",
    slug: "marcha-en-sitio",
    description:
      "Elevar rodillas a altura cómoda alternadamente. Objetivo: elevar temperatura corporal.",
    muscleGroup: "FULL_BODY",
    movementType: "ACTIVATION",
    category: "WARMUP",
    difficulty: 1,
    defaultDurationSec: 120,
    defaultSets: 1,
    jointStress: "LOW",
  },
  {
    name: "Círculos articulares",
    slug: "circulos-articulares",
    description:
      "Tobillos, rodillas, caderas, hombros, muñecas. 10 cada dirección por articulación.",
    muscleGroup: "FULL_BODY",
    movementType: "MOBILITY",
    category: "WARMUP",
    difficulty: 1,
    defaultReps: 10,
    defaultSets: 1,
    jointStress: "NONE",
  },
  {
    name: "Wall Slides",
    slug: "wall-slides",
    description:
      "Espalda plana contra pared, brazos en 'portero' a 90°. Deslizar arriba/abajo manteniendo contacto total con la pared.",
    muscleGroup: "SHOULDERS",
    movementType: "ACTIVATION",
    category: "PREHAB",
    difficulty: 2,
    defaultReps: 8,
    defaultSets: 2,
    jointStress: "LOW",
  },

  // === BLOQUE PRINCIPAL FASE CERO ===
  {
    name: "Flexiones en pared",
    slug: "flexiones-en-pared",
    description:
      "De pie frente a pared, manos a altura de hombros. Inclinar controladamente, tocar con nariz/frente, empujar. Juntar omóplatos al bajar, separarlos al empujar.",
    muscleGroup: "CHEST",
    movementType: "PUSH",
    category: "REGRESSION",
    difficulty: 1,
    defaultSets: 2,
    defaultReps: 12,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 6,
    jointStress: "LOW",
    bodyweightPercent: 0.25,
    safetyNotes: "Retracción escapular al descender, protracción al empujar.",
    // parentId → se vincula al crear "Flexión estándar"
  },
  {
    name: "Flexiones inclinadas",
    slug: "flexiones-inclinadas",
    description:
      "Manos sobre superficie elevada (encimera → mesa → silla). Cuerpo en línea recta inclinada. Progresar bajando la superficie.",
    muscleGroup: "CHEST",
    movementType: "PUSH",
    category: "REGRESSION",
    difficulty: 3,
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 7,
    jointStress: "MODERATE",
    bodyweightPercent: 0.45,
  },
  {
    name: "Flexiones estándar",
    slug: "flexiones-estandar",
    description:
      "Manos anchura de hombros, cuerpo línea recta cabeza-tobillos, descender hasta pecho casi al suelo.",
    muscleGroup: "CHEST",
    movementType: "PUSH",
    category: "STANDARD",
    difficulty: 5,
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultTempo: "3-1-1-0",
    defaultRpe: 8,
    jointStress: "MODERATE",
    bodyweightPercent: 0.65,
  },
  {
    name: "Sentadilla asistida",
    slug: "sentadilla-asistida",
    description:
      "Agarrarse a marco de puerta o encimera. Descender empujando caderas atrás. Profundidad: hasta silla o ~45°. Tibias lo más verticales posible.",
    muscleGroup: "LEGS",
    movementType: "SQUAT",
    category: "REGRESSION",
    difficulty: 1,
    defaultSets: 2,
    defaultReps: 12,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 6,
    jointStress: "LOW",
    targetJoints: "rodillas",
    safetyNotes:
      "La sujeción reduce carga sobre rodillas. Pecho arriba, tibias verticales.",
  },
  {
    name: "Elevaciones pronadas Y-T-W",
    slug: "elevaciones-pronadas-ytw",
    description:
      "Boca abajo. Y: brazos a 45° pulgares arriba. T: brazos a 90°. W: codos flexionados, exprimir escápulas. Elevar 5-10 cm, retención 2-3s.",
    muscleGroup: "BACK",
    movementType: "PULL",
    category: "REGRESSION",
    difficulty: 2,
    defaultSets: 2,
    defaultReps: 8,
    defaultRestSec: 60,
    defaultRpe: 6,
    jointStress: "LOW",
    safetyNotes:
      "No necesitas elevar mucho. Clave: sentir músculos entre omóplatos.",
  },
  {
    name: "Puente de glúteos",
    slug: "puente-de-gluteos",
    description:
      "Supino, rodillas flexionadas. Apretar glúteos, elevar caderas a línea recta. Retención 3s arriba. No hiperextender lumbar.",
    muscleGroup: "LEGS",
    movementType: "HINGE",
    category: "STANDARD",
    difficulty: 2,
    defaultSets: 2,
    defaultReps: 15,
    defaultRestSec: 60,
    defaultTempo: "2-3-2-0",
    defaultRpe: 6,
    jointStress: "NONE",
    safetyNotes: "Fuerza sale de glúteos, no de espalda baja. Exprimir arriba.",
  },
  {
    name: "Dead Bug (solo brazos)",
    slug: "dead-bug-solo-brazos",
    description:
      "Supino, rodillas flexionadas, brazos al techo. Lumbar PEGADA al suelo. Bajar un brazo atrás en 3s, subir en 2s. Si lumbar se despega, bajas demasiado.",
    muscleGroup: "CORE",
    movementType: "ISOMETRIC",
    category: "REGRESSION",
    difficulty: 2,
    defaultSets: 2,
    defaultReps: 8,
    defaultRestSec: 60,
    defaultTempo: "3-0-2-0",
    defaultRpe: 6,
    jointStress: "NONE",
    safetyNotes:
      "Lumbar pegada al suelo TODO el tiempo. Si se despega, reduce rango.",
  },
  {
    name: "McGill Curl-Up modificado",
    slug: "mcgill-curl-up",
    description:
      "Supino, 1 rodilla flexionada, 1 pierna recta. Manos bajo arco lumbar. Tensar abdominales, elevar cabeza+hombros+pecho como UNIDAD. NO hacer crunch.",
    muscleGroup: "CORE",
    movementType: "ISOMETRIC",
    category: "STANDARD",
    difficulty: 2,
    defaultDurationSec: 10,
    defaultSets: 3,
    defaultRestSec: 15,
    defaultRpe: 6,
    jointStress: "NONE",
    safetyNotes:
      "Pirámide: 5-3-1 reps × 10s retención. Cambiar pierna a mitad de serie.",
  },
];
```

---

## Fases de Desarrollo (Orden de Prioridad)

### Sprint 1: MVP funcional — "Puedo registrar mi sesión de hoy" (Día 1-2)

**Objetivo:** Poder abrir la app, ver la sesión de hoy y marcar ejercicios como completados.

1. `npx create-next-app@latest fitness-tracker` con App Router + Tailwind + TypeScript
2. `npm install prisma @prisma/client` → copiar schema → `npx prisma migrate dev`
3. Crear seed con los ejercicios de arriba → `npx prisma db seed`
4. **Página `/today`** — la más importante:
   - Muestra la fecha de hoy y qué sesión toca (Lun/Mié/Vie = Training, otros = Mobility)
   - Lista los ejercicios de la rutina del día como checklist
   - Cada ejercicio muestra: nombre, series × reps objetivo, tempo
   - Botón para marcar cada serie como completada
   - Al terminar, registra el DailyLog
5. **API routes** mínimas: GET rutina del día, POST registro de ejercicio, POST daily log

**Entregable:** App donde abres `/today`, ves tus ejercicios y los vas tachando.

### Sprint 2: Registro detallado — "Guardo variables reales" (Día 3-4)

1. **Widget `set-tracker`:** Para cada ejercicio, registrar por serie:
   - Reps completadas (o duración en segundos para isométricos)
   - RPE de la serie
   - Indicador de dolor (0-5)
   - Checkbox de "usé regresión" + nota
   - Calidad de forma (perfect/good/fair/poor)
2. **Timer de descanso:** Al completar una serie, inicia cuenta regresiva del descanso
3. **Resumen post-sesión:** Al finalizar, pedir RPE general, horas de sueño, nivel de energía, peso (opcional), notas
4. **Página `/log`:** Historial de sesiones pasadas con calendario visual

### Sprint 3: Catálogo y programa — "Veo mi plan completo" (Día 5-6)

1. **Página `/exercises`:** Grid de todos los ejercicios con filtros por grupo muscular y categoría
2. **Página `/exercises/[id]`:** Detalle del ejercicio con descripción, imagen, video, variantes (regresiones ↔ progresiones), historial de rendimiento en ese ejercicio
3. **Página `/program`:** Vista del programa completo con fases, semanas, benchmarks para avanzar
4. **CRUD de ejercicios:** Poder agregar ejercicios nuevos y editar existentes

### Sprint 4: Progreso y analíticas — "Veo mi avance" (Día 7-8)

1. **Página `/progress`:** Dashboard con:
   - Racha actual de días cumplidos (streak)
   - Gráfica de volumen semanal (series totales)
   - Progresión por ejercicio (reps o duración a lo largo del tiempo)
   - Peso corporal si se registra
   - Nivel de dolor promedio por semana
   - Mediciones corporales
2. **Indicadores de benchmark:** Barras de progreso hacia los criterios de avance de fase
3. **Exportar datos** a CSV/JSON

### Sprint 5: Polish y UX — "La app es un placer de usar" (Día 9-10)

1. **PWA (Progressive Web App):** Instalar en celular como app nativa, funciona offline
2. **Notificaciones/recordatorios**
3. **Dark mode** (entrenar a las 6am sin quedar ciego)
4. **Animaciones y micro-interacciones** al completar ejercicios y series
5. **Fotos de progreso** integradas con `BodyMeasurement`

---

## Comandos para Arrancar Mañana

```bash
# 1. Crear proyecto
npx create-next-app@latest fitness-tracker --typescript --tailwind --eslint --app --src-dir

# 2. Entrar al proyecto
cd fitness-tracker

# 3. Instalar dependencias
npm install prisma @prisma/client
npm install @radix-ui/react-icons lucide-react
npx shadcn@latest init

# 4. Inicializar Prisma con SQLite
npx prisma init --datasource-provider sqlite

# 5. Copiar el schema de este documento → prisma/schema.prisma

# 6. Crear migración
npx prisma migrate dev --name init

# 7. Crear archivo de seed → prisma/seed.ts
# Agregar en package.json:
# "prisma": { "seed": "ts-node --compiler-options {\"module\":\"commonjs\"} prisma/seed.ts" }

# 8. Ejecutar seed
npx prisma db seed

# 9. Abrir Prisma Studio para verificar datos
npx prisma studio

# 10. Arrancar dev server
npm run dev
```

---

## Modelo de Datos Visual (Relaciones Clave)

```
Program
  └── Phase (0: Integridad, 1: Base, 2: Alta Intensidad)
        └── Routine (Sesión A, Sesión B, Movilidad Diaria)
              └── RoutineExercise (orden, sets, reps, etc.)
                    └── Exercise (catálogo maestro)
                          ├── variants[] (regresiones / progresiones)
                          └── ExerciseLog[] (historial real)

DailyLog (fecha, estado, RPE, sueño, peso, notas)
  └── ExerciseLog[] (lo que realmente hiciste serie por serie)

BodyMeasurement (mediciones periódicas)
```

---

## Variables Críticas que Estás Trackeando

| Variable                | Tabla                        | Por qué importa                    |
| ----------------------- | ---------------------------- | ---------------------------------- |
| Reps por serie          | `ExerciseLog.repsPerSet`     | Detectar cuándo subir progresión   |
| RPE real vs objetivo    | `ExerciseLog.rpeActual`      | Evitar sobre/sub-entrenamiento     |
| Dolor durante ejercicio | `ExerciseLog.painDuring`     | Alerta temprana de lesión          |
| Calidad de forma        | `ExerciseLog.formQuality`    | No avanzar con técnica pobre       |
| ¿Usó regresión?         | `ExerciseLog.usedRegression` | Tracking honesto de capacidad real |
| Horas de sueño          | `DailyLog.sleepHours`        | Correlacionar con rendimiento      |
| Peso corporal           | `DailyLog.bodyWeight`        | Tendencia a largo plazo            |
| Estado de cumplimiento  | `DailyLog.status`            | Racha y adherencia                 |
| Volumen semanal         | Calculado de `ExerciseLog`   | Progresión de carga total          |
| Streak (racha)          | Calculado de `DailyLog`      | Motivación y consistencia          |
