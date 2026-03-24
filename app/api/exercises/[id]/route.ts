import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import type { MuscleGroup, MovementType, ExerciseCategory, JointStress } from "@prisma/client"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        parent: true,
        variants: true,
        exerciseLogs: {
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            dailyLog: {
              select: {
                date: true,
                routine: { select: { name: true } },
              },
            },
          },
        },
      },
    })

    if (!exercise) {
      return NextResponse.json({ error: "Ejercicio no encontrado" }, { status: 404 })
    }

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[GET /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error fetching exercise" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name, slug, description, imageUrl, videoUrl,
      muscleGroup, movementType, category, difficulty,
      parentId, defaultSets, defaultReps, defaultDurationSec,
      defaultRestSec, defaultTempo, defaultRpe,
      jointStress, targetJoints, contraindications, safetyNotes,
      bodyweightPercent,
    } = body

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description: description || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(muscleGroup !== undefined && { muscleGroup: muscleGroup as MuscleGroup }),
        ...(movementType !== undefined && { movementType: movementType as MovementType }),
        ...(category !== undefined && { category: category as ExerciseCategory }),
        ...(difficulty !== undefined && { difficulty }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(defaultSets !== undefined && { defaultSets }),
        ...(defaultReps !== undefined && { defaultReps }),
        ...(defaultDurationSec !== undefined && { defaultDurationSec }),
        ...(defaultRestSec !== undefined && { defaultRestSec }),
        ...(defaultTempo !== undefined && { defaultTempo: defaultTempo || null }),
        ...(defaultRpe !== undefined && { defaultRpe }),
        ...(jointStress !== undefined && { jointStress: jointStress as JointStress }),
        ...(targetJoints !== undefined && { targetJoints: targetJoints || null }),
        ...(contraindications !== undefined && { contraindications: contraindications || null }),
        ...(safetyNotes !== undefined && { safetyNotes: safetyNotes || null }),
        ...(bodyweightPercent !== undefined && { bodyweightPercent }),
      },
    })

    return NextResponse.json(exercise)
  } catch (error) {
    console.error("[PUT /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error updating exercise" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    // Check for existing logs before deleting
    const logCount = await prisma.exerciseLog.count({ where: { exerciseId: id } })
    if (logCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${logCount} registro(s) de sesiones. Elimina los registros primero.` },
        { status: 409 }
      )
    }

    // Also unlink variants that reference this as parent
    await prisma.exercise.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    })

    await prisma.exercise.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/exercises/[id]]", error)
    return NextResponse.json({ error: "Error deleting exercise" }, { status: 500 })
  }
}
