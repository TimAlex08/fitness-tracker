import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import type { MuscleGroup, MovementType, ExerciseCategory, JointStress } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const muscleGroup = searchParams.get("muscleGroup") as MuscleGroup | null
    const search = searchParams.get("q")

    const exercises = await prisma.exercise.findMany({
      where: {
        ...(muscleGroup && { muscleGroup }),
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
      orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
    })

    return NextResponse.json(exercises)
  } catch (error) {
    console.error("[GET /api/exercises]", error)
    return NextResponse.json({ error: "Error fetching exercises" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name, slug, description, imageUrl, videoUrl,
      muscleGroup, movementType, category, difficulty,
      parentId, defaultSets, defaultReps, defaultDurationSec,
      defaultRestSec, defaultTempo, defaultRpe,
      jointStress, targetJoints, contraindications, safetyNotes,
      bodyweightPercent,
    } = body

    if (!name || !muscleGroup || !movementType || !category) {
      return NextResponse.json(
        { error: "name, muscleGroup, movementType y category son requeridos" },
        { status: 400 }
      )
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        slug: slug || generateSlug(name),
        description: description || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        muscleGroup: muscleGroup as MuscleGroup,
        movementType: movementType as MovementType,
        category: category as ExerciseCategory,
        difficulty: difficulty ?? 1,
        parentId: parentId || null,
        defaultSets: defaultSets ?? null,
        defaultReps: defaultReps ?? null,
        defaultDurationSec: defaultDurationSec ?? null,
        defaultRestSec: defaultRestSec ?? 60,
        defaultTempo: defaultTempo || null,
        defaultRpe: defaultRpe ?? null,
        jointStress: (jointStress as JointStress) ?? "LOW",
        targetJoints: targetJoints || null,
        contraindications: contraindications || null,
        safetyNotes: safetyNotes || null,
        bodyweightPercent: bodyweightPercent ?? null,
      },
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error: unknown) {
    console.error("[POST /api/exercises]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ya existe un ejercicio con ese slug" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error creando ejercicio" }, { status: 500 })
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
