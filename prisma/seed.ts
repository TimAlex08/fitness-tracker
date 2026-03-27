import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import type {
  MuscleGroup,
  MovementType,
  ExerciseCategory,
  JointStress,
  SessionType,
} from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ---------- Interfaz para datos de seed ---------- //

interface ExerciseSeed {
  name: string
  slug: string
  description: string
  imageUrl?: string
  muscleGroup: MuscleGroup
  movementType: MovementType
  category: ExerciseCategory
  difficulty: number
  defaultSets?: number
  defaultReps?: number
  defaultDurationSec?: number
  defaultRestSec?: number
  defaultTempo?: string
  defaultRpe?: number
  jointStress: JointStress
  targetJoints?: string
  contraindications?: string
  safetyNotes?: string
  bodyweightPercent?: number
}

// ---------- Ejercicios Fase Cero ---------- //

const exercises: ExerciseSeed[] = [
  // === MOVILIDAD DIARIA ===
  {
    name: "Cat-Cow",
    slug: "cat-cow",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Cat_Stretch/0.jpg",
    description:
      "En cuadrupedia, alternar flexión/extensión de columna. Iniciar movimiento desde región torácica. Retención 3s en cada extremo.",
    muscleGroup: "MOBILITY",
    movementType: "MOBILITY",
    category: "PREHAB",
    difficulty: 1,
    defaultReps: 12,
    defaultSets: 1,
    jointStress: "NONE",
    safetyNotes: "Movimiento lento y controlado. No forzar la extensión lumbar.",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side-Lying_Floor_Stretch/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Kneeling_Hip_Flexor/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/90_90_Hamstring/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Chin_To_Chest_Stretch/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Scapular_Pull-Up/0.jpg",
    description: "De pie, juntar omóplatos hacia atrás y abajo. Retención 3-5s.",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pelvic_Tilt_Into_Bridge/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Childs_Pose/0.jpg",
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
  },
  {
    name: "Flexiones inclinadas",
    slug: "flexiones-inclinadas",
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Push-Up/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Goblet_Squat/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Superman/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Single_Leg_Glute_Bridge/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dead_Bug/0.jpg",
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
    imageUrl: "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg",
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
]

// ---------- Definición de rutinas ---------- //

interface RoutineExerciseSeed {
  slug: string
  order: number
  block: string
  sets?: number
  reps?: number
  durationSec?: number
  restSec?: number
  tempo?: string
  rpe?: number
  notes?: string
}

// Rutina "Full Body A" — Lun/Mié/Vie
const fullBodyAExercises: RoutineExerciseSeed[] = [
  // Calentamiento
  { slug: "marcha-en-sitio", order: 1, block: "warmup", durationSec: 120 },
  { slug: "circulos-articulares", order: 2, block: "warmup", sets: 1, reps: 10 },
  { slug: "wall-slides", order: 3, block: "warmup", sets: 2, reps: 8 },

  // Bloque principal
  {
    slug: "flexiones-en-pared",
    order: 4,
    block: "main",
    sets: 2,
    reps: 12,
    restSec: 75,
    tempo: "2-1-2-0",
    rpe: 6,
  },
  {
    slug: "sentadilla-asistida",
    order: 5,
    block: "main",
    sets: 2,
    reps: 12,
    restSec: 75,
    tempo: "2-1-2-0",
    rpe: 6,
  },
  {
    slug: "elevaciones-pronadas-ytw",
    order: 6,
    block: "main",
    sets: 2,
    reps: 8,
    restSec: 60,
    rpe: 6,
    notes: "Y, T, W: 8 reps cada posición",
  },
  {
    slug: "puente-de-gluteos",
    order: 7,
    block: "main",
    sets: 2,
    reps: 15,
    restSec: 60,
    tempo: "2-3-2-0",
    rpe: 6,
  },
  {
    slug: "dead-bug-solo-brazos",
    order: 8,
    block: "main",
    sets: 2,
    reps: 8,
    restSec: 60,
    tempo: "3-0-2-0",
    rpe: 6,
  },
  {
    slug: "mcgill-curl-up",
    order: 9,
    block: "main",
    sets: 3,
    durationSec: 10,
    restSec: 15,
    rpe: 6,
    notes: "Pirámide: 5-3-1 reps × 10s retención",
  },

  // Vuelta a la calma
  { slug: "childs-pose", order: 10, block: "cooldown", durationSec: 45 },
]

// Rutina "Movilidad Diaria" — todos los días
const movilidadDiariaExercises: RoutineExerciseSeed[] = [
  { slug: "cat-cow", order: 1, block: "main", sets: 1, reps: 12 },
  { slug: "thread-the-needle", order: 2, block: "main", sets: 1, reps: 8 },
  { slug: "book-opener", order: 3, block: "main", sets: 1, reps: 6 },
  {
    slug: "estiramiento-flexor-cadera",
    order: 4,
    block: "main",
    sets: 2,
    durationSec: 30,
  },
  { slug: "hip-switches-90-90", order: 5, block: "main", sets: 1, reps: 8 },
  { slug: "chin-tucks", order: 6, block: "main", sets: 1, reps: 10, durationSec: 5 },
  { slug: "retracciones-escapulares", order: 7, block: "main", sets: 1, reps: 15 },
  {
    slug: "basculacion-pelvica-posterior",
    order: 8,
    block: "main",
    sets: 1,
    reps: 10,
    durationSec: 5,
  },
]

// ---------- Jerarquía de progresión (parentId links) ---------- //

interface VariantLink {
  childSlug: string
  parentSlug: string
}

const variantLinks: VariantLink[] = [
  { childSlug: "flexiones-en-pared", parentSlug: "flexiones-estandar" },
  { childSlug: "flexiones-inclinadas", parentSlug: "flexiones-estandar" },
]

// ---------- Seed principal ---------- //

async function main() {
  // 0.- Crear admin por defecto
  console.log("👤 Creando usuario admin...")
  const existing = await prisma.user.findUnique({ where: { email: "admin@workout.app" } })
  if (!existing) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@workout.app",
        password: await bcrypt.hash("admin123", 12),
        role: "admin",
      },
    })
    console.log("   ✓ Admin creado: admin@workout.app / admin123")
  } else {
    console.log("   ✓ Admin ya existe")
  }
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@workout.app" } })

  // 1.- Limpiar datos existentes (orden respeta relaciones)
  console.log("🗑️  Limpiando datos existentes...")
  await prisma.exerciseOverride.deleteMany()
  await prisma.programDay.deleteMany()
  await prisma.routineExercise.deleteMany()
  await prisma.exerciseLog.deleteMany()
  await prisma.dailyLog.deleteMany()
  await prisma.routine.deleteMany()
  await prisma.phase.deleteMany()
  await prisma.program.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.bodyMeasurement.deleteMany()

  // 2.- Crear ejercicios
  console.log("💪 Creando ejercicios...")
  const exerciseMap = new Map<string, string>()

  for (const exercise of exercises) {
    const created = await prisma.exercise.create({ data: exercise })
    exerciseMap.set(exercise.slug, created.id)
  }
  console.log(`   ✓ ${exercises.length} ejercicios creados`)

  // 3.- Vincular jerarquía de progresión
  console.log("🔗 Vinculando progresiones/regresiones...")
  for (const link of variantLinks) {
    const parentId = exerciseMap.get(link.parentSlug)
    const childId = exerciseMap.get(link.childSlug)
    if (parentId && childId) {
      await prisma.exercise.update({
        where: { id: childId },
        data: { parent: { connect: { id: parentId } } },
      })
    }
  }
  console.log(`   ✓ ${variantLinks.length} vínculos de variantes`)

  // 4.- Crear programa
  console.log("📋 Creando programa...")
  const program = await prisma.program.create({
    data: {
      userId: admin.id,
      name: "Plan Táctico 0 a 100",
      description:
        "Programa de reacondicionamiento desde cero. Fase Cero: integridad estructural, movilidad y activación.",
      isActive: true,
    },
  })

  // 5.- Crear Fase Cero
  const phase = await prisma.phase.create({
    data: {
      programId: program.id,
      name: "Fase Cero: Integridad Estructural",
      order: 0,
      weekStart: 1,
      weekEnd: 4,
      description:
        "Ejercicios de baja carga articular, movilidad diaria, activación. Objetivo: preparar el cuerpo para cargas progresivas.",
      rpeTarget: "6-7",
      tempoDefault: "2-1-2-0",
      benchmarks: JSON.stringify({
        flexionesPared: "2×12 sin dolor, RPE ≤ 5 → avanzar a inclinadas",
        sentadillaAsistida: "2×12 profundidad completa sin sujeción → libre",
        puente: "2×15 sin usar espalda baja → puente a una pierna",
        deadBug: "2×8 sin perder lumbar pegada → agregar pierna",
        movilidad: "Rutina diaria sin saltarse 4 semanas consecutivas",
      }),
    },
  })

  // 6.- Crear rutinas (globales, vinculadas al usuario)
  console.log("📅 Creando rutinas...")
  const fullBodyA = await prisma.routine.create({
    data: {
      userId: admin.id,
      name: "Sesión Full Body A",
      sessionType: "TRAINING" as SessionType,
      durationMin: 45,
      description:
        "Sesión principal: calentamiento + bloque de fuerza/activación + vuelta a la calma.",
    },
  })

  const movilidadDiaria = await prisma.routine.create({
    data: {
      userId: admin.id,
      name: "Movilidad Diaria",
      sessionType: "MOBILITY" as SessionType,
      durationMin: 15,
      description:
        "Rutina de movilidad para realizar todos los días. Prioridad: columna, caderas, hombros.",
    },
  })

  // 7.- Asignar ejercicios a Full Body A
  console.log("🏋️  Asignando ejercicios a rutinas...")
  for (const re of fullBodyAExercises) {
    const exerciseId = exerciseMap.get(re.slug)
    if (!exerciseId) {
      console.warn(`   ⚠ Ejercicio "${re.slug}" no encontrado, saltando...`)
      continue
    }
    await prisma.routineExercise.create({
      data: {
        routineId: fullBodyA.id,
        exerciseId,
        order: re.order,
        block: re.block,
        sets: re.sets,
        reps: re.reps,
        durationSec: re.durationSec,
        restSec: re.restSec,
        tempo: re.tempo,
        rpe: re.rpe,
        notes: re.notes,
      },
    })
  }
  console.log(`   ✓ ${fullBodyAExercises.length} ejercicios en Full Body A`)

  // 8.- Asignar ejercicios a Movilidad Diaria
  for (const re of movilidadDiariaExercises) {
    const exerciseId = exerciseMap.get(re.slug)
    if (!exerciseId) {
      console.warn(`   ⚠ Ejercicio "${re.slug}" no encontrado, saltando...`)
      continue
    }
    await prisma.routineExercise.create({
      data: {
        routineId: movilidadDiaria.id,
        exerciseId,
        order: re.order,
        block: re.block,
        sets: re.sets,
        reps: re.reps,
        durationSec: re.durationSec,
        restSec: re.restSec,
        tempo: re.tempo,
        rpe: re.rpe,
        notes: re.notes,
      },
    })
  }
  console.log(
    `   ✓ ${movilidadDiariaExercises.length} ejercicios en Movilidad Diaria`,
  )

  // 9.- Asignar rutinas a días del programa
  console.log("📆 Asignando rutinas a días de la fase...")

  // Full Body A: lunes, miércoles, viernes
  for (const day of ["monday", "wednesday", "friday"]) {
    await prisma.programDay.create({
      data: { phaseId: phase.id, routineId: fullBodyA.id, dayOfWeek: day },
    })
  }

  // Movilidad Diaria: todos los días
  for (const day of ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]) {
    await prisma.programDay.create({
      data: { phaseId: phase.id, routineId: movilidadDiaria.id, dayOfWeek: day },
    })
  }

  console.log("   ✓ ProgramDays creados (Full Body A: L/M/V · Movilidad: todos los días)")

  console.log("\n✅ Seed completado exitosamente")
  console.log(`   Programa: ${program.name}`)
  console.log(`   Fase: ${phase.name} (semanas ${phase.weekStart}-${phase.weekEnd})`)
  console.log(`   Rutinas: Full Body A (L/M/V) + Movilidad Diaria`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
