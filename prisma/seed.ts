import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const exercises = [
  // === MOVILIDAD DIARIA ===
  {
    name: "Cat-Cow",
    slug: "cat-cow",
    description:
      "En cuadrupedia, alternar flexión/extensión de columna. Iniciar movimiento desde región torácica. Retención 3s en cada extremo.",
    muscleGroup: "MOBILITY",
    category: "PREHAB",
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
    category: "PREHAB",
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
    category: "PREHAB",
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
    category: "PREHAB",
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
    category: "PREHAB",
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
    category: "PREHAB",
    defaultReps: 10,
    defaultSets: 1,
    defaultDurationSec: 5,
    jointStress: "NONE",
  },
  {
    name: "Retracciones escapulares",
    slug: "retracciones-escapulares",
    description: "De pie, juntar omóplatos hacia atrás y abajo. Retención 3-5s.",
    muscleGroup: "BACK",
    category: "PREHAB",
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
    category: "PREHAB",
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
    category: "COOLDOWN",
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
    category: "WARMUP",
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
    category: "WARMUP",
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
    category: "PREHAB",
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
    category: "REGRESSION",
    defaultSets: 2,
    defaultReps: 12,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 6,
    jointStress: "LOW",
    safetyNotes: "Retracción escapular al descender, protracción al empujar.",
  },
  {
    name: "Flexiones inclinadas",
    slug: "flexiones-inclinadas",
    description:
      "Manos sobre superficie elevada (encimera → mesa → silla). Cuerpo en línea recta inclinada. Progresar bajando la superficie.",
    muscleGroup: "CHEST",
    category: "REGRESSION",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 7,
    jointStress: "MODERATE",
  },
  {
    name: "Flexiones estándar",
    slug: "flexiones-estandar",
    description:
      "Manos anchura de hombros, cuerpo línea recta cabeza-tobillos, descender hasta pecho casi al suelo.",
    muscleGroup: "CHEST",
    category: "STANDARD",
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    defaultTempo: "3-1-1-0",
    defaultRpe: 8,
    jointStress: "MODERATE",
  },
  {
    name: "Sentadilla asistida",
    slug: "sentadilla-asistida",
    description:
      "Agarrarse a marco de puerta o encimera. Descender empujando caderas atrás. Profundidad: hasta silla o ~45°. Tibias lo más verticales posible.",
    muscleGroup: "LEGS",
    category: "REGRESSION",
    defaultSets: 2,
    defaultReps: 12,
    defaultRestSec: 75,
    defaultTempo: "2-1-2-0",
    defaultRpe: 6,
    jointStress: "LOW",
    targetJoints: "rodillas",
    safetyNotes: "La sujeción reduce carga sobre rodillas. Pecho arriba, tibias verticales.",
  },
  {
    name: "Elevaciones pronadas Y-T-W",
    slug: "elevaciones-pronadas-ytw",
    description:
      "Boca abajo. Y: brazos a 45° pulgares arriba. T: brazos a 90°. W: codos flexionados, exprimir escápulas. Elevar 5-10 cm, retención 2-3s.",
    muscleGroup: "BACK",
    category: "REGRESSION",
    defaultSets: 2,
    defaultReps: 8,
    defaultRestSec: 60,
    defaultRpe: 6,
    jointStress: "LOW",
    safetyNotes: "No necesitas elevar mucho. Clave: sentir músculos entre omóplatos.",
  },
  {
    name: "Puente de glúteos",
    slug: "puente-de-gluteos",
    description:
      "Supino, rodillas flexionadas. Apretar glúteos, elevar caderas a línea recta. Retención 3s arriba. No hiperextender lumbar.",
    muscleGroup: "LEGS",
    category: "STANDARD",
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
    category: "REGRESSION",
    defaultSets: 2,
    defaultReps: 8,
    defaultRestSec: 60,
    defaultTempo: "3-0-2-0",
    defaultRpe: 6,
    jointStress: "NONE",
    safetyNotes: "Lumbar pegada al suelo TODO el tiempo. Si se despega, reduce rango.",
  },
  {
    name: "McGill Curl-Up modificado",
    slug: "mcgill-curl-up",
    description:
      "Supino, 1 rodilla flexionada, 1 pierna recta. Manos bajo arco lumbar. Tensar abdominales, elevar cabeza+hombros+pecho como UNIDAD. NO hacer crunch.",
    muscleGroup: "CORE",
    category: "STANDARD",
    defaultDurationSec: 10,
    defaultSets: 3,
    defaultRestSec: 15,
    defaultRpe: 6,
    jointStress: "NONE",
    safetyNotes: "Pirámide: 5-3-1 reps × 10s retención. Cambiar pierna a mitad de serie.",
  },
]

async function main() {
  console.log("Seeding exercises...")

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { slug: exercise.slug },
      update: exercise,
      create: exercise,
    })
  }

  console.log(`✓ ${exercises.length} exercises seeded`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
