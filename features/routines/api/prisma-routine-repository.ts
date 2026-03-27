import { prisma } from "@/lib/prisma"
import type { Routine } from "@prisma/client"
import type { CreateRoutineBody, UpdateRoutineBody, RoutineExerciseBody } from "../schemas/routine.schema"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RoutineListItem {
  id: string
  name: string
  sessionType: string
  durationMin: number | null
  exerciseCount: number
  lastUsed: Date | null
}

export interface RoutineWithExercises extends Routine {
  exercises: {
    id: string
    exerciseId: string
    order: number
    block: string | null
    sets: number | null
    reps: number | null
    durationSec: number | null
    restSec: number | null
    tempo: string | null
    rpe: number | null
    notes: string | null
    exercise: {
      id: string
      name: string
      muscleGroup: string
      movementType: string
      category: string
    }
  }[]
}

// ─── Repositorio ──────────────────────────────────────────────────────────────

export class PrismaRoutineRepository {
  async findAll(userId: string): Promise<RoutineListItem[]> {
    const routines = await prisma.routine.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { exercises: true } },
        dailyLogs: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    })

    return routines.map((r) => ({
      id: r.id,
      name: r.name,
      sessionType: r.sessionType,
      durationMin: r.durationMin,
      exerciseCount: r._count.exercises,
      lastUsed: r.dailyLogs[0]?.date ?? null,
    }))
  }

  async findById(id: string, userId: string): Promise<RoutineWithExercises | null> {
    return prisma.routine.findFirst({
      where: { id, userId },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: {
            exercise: {
              select: { id: true, name: true, muscleGroup: true, movementType: true, category: true },
            },
          },
        },
      },
    })
  }

  async create(userId: string, data: CreateRoutineBody): Promise<Routine> {
    return prisma.routine.create({
      data: {
        userId,
        name: data.name,
        sessionType: data.sessionType,
        durationMin: data.durationMin ?? null,
        description: data.description ?? null,
      },
    })
  }

  async update(id: string, userId: string, data: UpdateRoutineBody): Promise<Routine> {
    return prisma.routine.update({
      where: { id, userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sessionType !== undefined && { sessionType: data.sessionType }),
        ...(data.durationMin !== undefined && { durationMin: data.durationMin }),
        ...(data.description !== undefined && { description: data.description }),
      },
    })
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.routine.delete({ where: { id, userId } })
  }

  // Reemplaza todos los ejercicios de la rutina en una transacción
  async replaceExercises(id: string, userId: string, exercises: RoutineExerciseBody[]): Promise<void> {
    // Verificar que la rutina pertenece al usuario
    const routine = await prisma.routine.findFirst({ where: { id, userId } })
    if (!routine) throw new Error("Rutina no encontrada")

    await prisma.$transaction(async (tx) => {
      await tx.routineExercise.deleteMany({ where: { routineId: id } })
      if (exercises.length > 0) {
        await tx.routineExercise.createMany({
          data: exercises.map((ex, idx) => ({
            routineId: id,
            exerciseId: ex.exerciseId,
            order: ex.order ?? idx,
            block: ex.block ?? "main",
            sets: ex.sets ?? null,
            reps: ex.reps ?? null,
            durationSec: ex.durationSec ?? null,
            restSec: ex.restSec ?? null,
            tempo: ex.tempo ?? null,
            rpe: ex.rpe ?? null,
            notes: ex.notes ?? null,
          })),
        })
      }
    })
  }
}
