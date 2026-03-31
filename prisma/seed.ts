import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import pg from "pg"

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ─── User ──────────────────────────────────────────────────────────────────
  const password = await bcrypt.hash("workout123", 10)
  const user = await prisma.user.upsert({
    where: { email: "demo@workout.app" },
    update: {},
    create: { name: "Demo User", email: "demo@workout.app", password },
  })
  console.log("✓ User created:", user.email)

  // ─── Exercise Families ──────────────────────────────────────────────────────
  const familyFlexiones = await prisma.exerciseFamily.upsert({
    where: { slug: "flexiones" },
    update: {},
    create: { name: "Flexiones", slug: "flexiones", description: "Empuje horizontal de suelo" },
  })

  const familySentadilla = await prisma.exerciseFamily.upsert({
    where: { slug: "sentadilla" },
    update: {},
    create: { name: "Sentadilla", slug: "sentadilla", description: "Patrón de sentadilla" },
  })

  const familyPlancha = await prisma.exerciseFamily.upsert({
    where: { slug: "plancha" },
    update: {},
    create: { name: "Plancha", slug: "plancha", description: "Isométrico de core" },
  })

  console.log("✓ Exercise families created")

  // ─── Exercises ─────────────────────────────────────────────────────────────
  const exFlexionRodillas = await prisma.exercise.upsert({
    where: { slug: "flexion-rodillas" },
    update: {},
    create: {
      name: "Flexión de rodillas",
      slug: "flexion-rodillas",
      description: "Flexión con apoyo en rodillas. Ideal para construir base de fuerza.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "REGRESSION",
      difficulty: 1,
      familyId: familyFlexiones.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSec: 60,
      defaultTempo: "2-1-2-0",
      defaultRpe: 6,
      jointStress: "LOW",
      safetyNotes: "Mantener columna neutra.",
    },
  })

  const exFlexionEstandar = await prisma.exercise.upsert({
    where: { slug: "flexion-estandar" },
    update: {},
    create: {
      name: "Flexión estándar",
      slug: "flexion-estandar",
      description: "Flexión completa de suelo. Patrón base.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "STANDARD",
      difficulty: 3,
      familyId: familyFlexiones.id,
      familyLevel: 2,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 7,
      jointStress: "LOW",
      safetyNotes: "Codos a 45°, no flectados ni perpendiculares.",
    },
  })

  const exFlexionDeclinada = await prisma.exercise.upsert({
    where: { slug: "flexion-declinada" },
    update: {},
    create: {
      name: "Flexión declinada",
      slug: "flexion-declinada",
      description: "Pies elevados, mayor activación de pectoral superior.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "PROGRESSION",
      difficulty: 5,
      familyId: familyFlexiones.id,
      familyLevel: 3,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 8,
      jointStress: "MODERATE",
    },
  })

  const exFlexionDiamante = await prisma.exercise.upsert({
    where: { slug: "flexion-diamante" },
    update: {},
    create: {
      name: "Flexión diamante",
      slug: "flexion-diamante",
      description: "Variante con manos juntas. Mayor énfasis en tríceps.",
      muscleGroup: "CHEST",
      movementType: "PUSH",
      category: "STANDARD",
      difficulty: 4,
      familyId: familyFlexiones.id,
      familyLevel: 2,
      familyRole: "VARIANT",
      defaultSets: 3,
      defaultReps: 8,
      defaultRestSec: 90,
      jointStress: "LOW",
    },
  })

  const exSentadillaAsistida = await prisma.exercise.upsert({
    where: { slug: "sentadilla-asistida" },
    update: {},
    create: {
      name: "Sentadilla asistida",
      slug: "sentadilla-asistida",
      description: "Sentadilla con apoyo en silla o TRX. Progresión inicial.",
      muscleGroup: "LEGS",
      movementType: "SQUAT",
      category: "REGRESSION",
      difficulty: 1,
      familyId: familySentadilla.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 10,
      defaultRestSec: 60,
      defaultRpe: 6,
      jointStress: "LOW",
    },
  })

  const exSentadillaEstandar = await prisma.exercise.upsert({
    where: { slug: "sentadilla-estandar" },
    update: {},
    create: {
      name: "Sentadilla estándar",
      slug: "sentadilla-estandar",
      description: "Sentadilla libre con peso corporal.",
      muscleGroup: "LEGS",
      movementType: "SQUAT",
      category: "STANDARD",
      difficulty: 3,
      familyId: familySentadilla.id,
      familyLevel: 2,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultReps: 12,
      defaultRestSec: 90,
      defaultTempo: "2-1-2-0",
      defaultRpe: 7,
      jointStress: "MODERATE",
      targetJoints: "Rodillas, caderas",
    },
  })

  const exPlanchaEstandar = await prisma.exercise.upsert({
    where: { slug: "plancha-estandar" },
    update: {},
    create: {
      name: "Plancha estándar",
      slug: "plancha-estandar",
      description: "Isométrico de core en posición de flexión.",
      muscleGroup: "CORE",
      movementType: "ISOMETRIC",
      category: "STANDARD",
      difficulty: 2,
      familyId: familyPlancha.id,
      familyLevel: 1,
      familyRole: "MAIN_PATH",
      defaultSets: 3,
      defaultDurationSec: 30,
      defaultRestSec: 60,
      defaultRpe: 6,
      jointStress: "NONE",
    },
  })

  const exCatCow = await prisma.exercise.upsert({
    where: { slug: "cat-cow" },
    update: {},
    create: {
      name: "Cat-Cow",
      slug: "cat-cow",
      description: "En cuadrupedia, alternar flexión/extensión de columna. 3s retención.",
      muscleGroup: "MOBILITY",
      movementType: "MOBILITY",
      category: "PREHAB",
      difficulty: 1,
      defaultSets: 1,
      defaultReps: 12,
      defaultRestSec: 30,
      jointStress: "NONE",
      safetyNotes: "Movimiento lento y controlado.",
    },
  })

  const exGluteoBridge = await prisma.exercise.upsert({
    where: { slug: "gluteo-bridge" },
    update: {},
    create: {
      name: "Glúteo Bridge",
      slug: "gluteo-bridge",
      description: "Puente de glúteos. Activación posterior.",
      muscleGroup: "LEGS",
      movementType: "HINGE",
      category: "PREHAB",
      difficulty: 1,
      defaultSets: 3,
      defaultReps: 15,
      defaultRestSec: 45,
      jointStress: "NONE",
    },
  })

  console.log("✓ Exercises created")

  // ─── Routines ──────────────────────────────────────────────────────────────
  const routineFullBody = await prisma.routine.create({
    data: {
      userId: user.id,
      name: "Full Body A",
      description: "Sesión de fuerza full body. Fase Cero.",
      sessionType: "TRAINING",
      durationMin: 45,
      exercises: {
        create: [
          { order: 1, exerciseId: exCatCow.id, block: "Calentamiento" },
          { order: 2, exerciseId: exGluteoBridge.id, sets: 2, reps: 15, block: "Activación" },
          { order: 3, exerciseId: exFlexionRodillas.id, sets: 3, reps: 10, restSec: 60, rpe: 6, block: "Principal" },
          { order: 4, exerciseId: exSentadillaAsistida.id, sets: 3, reps: 10, restSec: 60, rpe: 6, block: "Principal" },
          { order: 5, exerciseId: exPlanchaEstandar.id, sets: 3, durationSec: 20, restSec: 60, block: "Core" },
        ],
      },
    },
  })

  const routineMovilidad = await prisma.routine.create({
    data: {
      userId: user.id,
      name: "Movilidad Diaria",
      description: "Rutina de movilidad y activación. Todos los días.",
      sessionType: "MOBILITY",
      durationMin: 20,
      exercises: {
        create: [
          { order: 1, exerciseId: exCatCow.id, sets: 2, reps: 10 },
          { order: 2, exerciseId: exGluteoBridge.id, sets: 2, reps: 15 },
        ],
      },
    },
  })

  console.log("✓ Routines created")

  // ─── Collection + Program + ProgramRoutines ────────────────────────────────
  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "Integridad Estructural",
      description: "Programa de construcción de base. Fases cero a dos.",
      isActive: true,
    },
  })

  const program = await prisma.program.create({
    data: {
      collectionId: collection.id,
      name: "Fase Cero",
      description: "Baja carga articular, movilidad y activación. 6 semanas.",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-05-12"),
      isActive: true,
      rpeTarget: "6-7",
    },
  })

  await prisma.programRoutine.create({
    data: {
      programId: program.id,
      routineId: routineFullBody.id,
      recurrenceDays: ["MON", "WED", "FRI"],
    },
  })

  await prisma.programRoutine.create({
    data: {
      programId: program.id,
      routineId: routineMovilidad.id,
      recurrenceDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    },
  })

  console.log("✓ Collection, Program, and ProgramRoutines created")
  console.log("🎉 Seed complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })