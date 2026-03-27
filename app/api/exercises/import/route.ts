import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidateTag } from "next/cache"

// ─── Schema de importación (menos estricto que create) ────────────────────────

const MUSCLE_GROUPS = ["CHEST", "BACK", "LEGS", "SHOULDERS", "CORE", "MOBILITY", "FULL_BODY"] as const
const MOVEMENT_TYPES = ["PUSH", "PULL", "SQUAT", "HINGE", "CARRY", "ISOMETRIC", "MOBILITY", "ACTIVATION"] as const
const CATEGORIES = ["STANDARD", "REGRESSION", "PROGRESSION", "PREHAB", "WARMUP", "COOLDOWN"] as const
const JOINT_STRESS = ["NONE", "LOW", "MODERATE", "HIGH"] as const

const importRowSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum(MUSCLE_GROUPS),
  movementType: z.enum(MOVEMENT_TYPES),
  category: z.enum(CATEGORIES).default("STANDARD"),
  difficulty: z.coerce.number().int().min(1).max(10).default(1),
  defaultSets: z.coerce.number().int().min(1).max(20).nullable().optional(),
  defaultReps: z.coerce.number().int().min(1).max(100).nullable().optional(),
  defaultDurationSec: z.coerce.number().int().min(1).max(3600).nullable().optional(),
  defaultRestSec: z.coerce.number().int().min(0).max(600).default(60),
  defaultTempo: z.string().max(20).nullable().optional(),
  defaultRpe: z.coerce.number().min(1).max(10).nullable().optional(),
  jointStress: z.enum(JOINT_STRESS).default("LOW"),
  targetJoints: z.string().max(200).nullable().optional(),
  contraindications: z.string().max(500).nullable().optional(),
  safetyNotes: z.string().max(500).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
})

const importBodySchema = z.object({
  exercises: z.array(importRowSchema).min(1).max(500),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlug(base: string, existingSlugs: Set<string>): Promise<string> {
  let slug = base
  let counter = 1
  while (existingSlugs.has(slug)) {
    slug = `${base}-${counter++}`
  }
  existingSlugs.add(slug)
  return slug
}

// ─── POST /api/exercises/import ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = importBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // Pre-cargar slugs existentes para detectar duplicados
    const existing = await prisma.exercise.findMany({ select: { slug: true } })
    const existingSlugs = new Set(existing.map((e) => e.slug))

    const errors: { row: number; name: string; message: string }[] = []
    const toCreate: Parameters<typeof prisma.exercise.create>[0]["data"][] = []

    for (let i = 0; i < parsed.data.exercises.length; i++) {
      const row = parsed.data.exercises[i]
      const slug = await uniqueSlug(generateSlug(row.name), existingSlugs)

      toCreate.push({
        name: row.name,
        slug,
        description: row.description ?? null,
        muscleGroup: row.muscleGroup,
        movementType: row.movementType,
        category: row.category,
        difficulty: row.difficulty,
        defaultSets: row.defaultSets ?? null,
        defaultReps: row.defaultReps ?? null,
        defaultDurationSec: row.defaultDurationSec ?? null,
        defaultRestSec: row.defaultRestSec,
        defaultTempo: row.defaultTempo ?? null,
        defaultRpe: row.defaultRpe ?? null,
        jointStress: row.jointStress,
        targetJoints: row.targetJoints ?? null,
        contraindications: row.contraindications ?? null,
        safetyNotes: row.safetyNotes ?? null,
      })
    }

    // Insertar todos en una transacción
    let imported = 0
    await prisma.$transaction(async (tx) => {
      for (const data of toCreate) {
        try {
          await tx.exercise.create({ data })
          imported++
        } catch (err: unknown) {
          const name = (data as { name: string }).name
          const idx = toCreate.indexOf(data)
          errors.push({
            row: idx + 1,
            name,
            message: err instanceof Error ? err.message : "Error desconocido",
          })
        }
      }
    })

    revalidateTag("exercises", "max")

    return NextResponse.json({ imported, skipped: errors.length, errors }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/exercises/import]", error)
    return NextResponse.json({ error: "Error importando ejercicios" }, { status: 500 })
  }
}
