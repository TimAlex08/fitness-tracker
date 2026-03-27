import { prisma } from "@/lib/prisma"
import type { Program } from "@prisma/client"
import type { CreateProgramBody } from "../schemas/program.schema"
import type { ProgramRepository } from "./program-repository"

export class PrismaProgramRepository implements ProgramRepository {
  async create(data: CreateProgramBody, userId: string): Promise<Program> {
    return prisma.$transaction(async (tx) => {
      // 1. Desactivar programas activos si el nuevo será activo
      if (data.isActive) {
        await tx.program.updateMany({
          where: { isActive: true, userId },
          data: { isActive: false },
        })
      }

      // 2. Crear programa con fases y días asignados
      const program = await tx.program.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          isActive: data.isActive,
          phases: {
            create: data.phases.map((phase) => ({
              name: phase.name,
              order: phase.order,
              weekStart: phase.weekStart,
              weekEnd: phase.weekEnd,
              description: phase.description,
              rpeTarget: phase.rpeTarget,
              tempoDefault: phase.tempoDefault,
              benchmarks: phase.benchmarks,
              programDays: phase.programDays
                ? {
                    create: phase.programDays.map((pd) => ({
                      routineId: pd.routineId,
                      dayOfWeek: pd.dayOfWeek,
                      weekNumber: pd.weekNumber ?? null,
                      overrides: pd.overrides
                        ? {
                            create: pd.overrides.map((o) => ({
                              exerciseId: o.exerciseId,
                              sets: o.sets ?? null,
                              reps: o.reps ?? null,
                              durationSec: o.durationSec ?? null,
                              restSec: o.restSec ?? null,
                              tempo: o.tempo ?? null,
                              rpe: o.rpe ?? null,
                              notes: o.notes ?? null,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
            })),
          },
        },
        include: {
          phases: {
            include: {
              programDays: {
                include: {
                  routine: true,
                  overrides: true,
                },
              },
            },
          },
        },
      })

      return program
    })
  }

  async findAll(userId: string): Promise<Program[]> {
    return prisma.program.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  }

  async findById(id: string, userId: string): Promise<Program | null> {
    return prisma.program.findUnique({
      where: { id, userId },
      include: {
        phases: {
          include: {
            programDays: {
              include: {
                routine: {
                  include: {
                    exercises: {
                      include: { exercise: true },
                      orderBy: { order: "asc" },
                    },
                  },
                },
                overrides: true,
              },
            },
          },
        },
      },
    })
  }

  async delete(id: string): Promise<void> {
    await prisma.program.delete({
      where: { id },
    })
  }
}
