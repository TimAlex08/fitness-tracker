import { prisma } from "@/lib/prisma"
import type { Program } from "@prisma/client"
import type { CreateProgramBody } from "../schemas/program.schema"
import type { ProgramRepository } from "./program-repository"

export class PrismaProgramRepository implements ProgramRepository {
  async create(data: CreateProgramBody, userId: string): Promise<Program> {
    return prisma.$transaction(async (tx) => {
      // 1. Deactivate existing active programs if the new one is active
      if (data.isActive) {
        await tx.program.updateMany({
          where: { isActive: true, userId },
          data: { isActive: false },
        })
      }

      // 2. Create the new program with all its nested entities
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
              routines: {
                create: phase.routines.map((routine) => ({
                  name: routine.name,
                  dayOfWeek: routine.dayOfWeek,
                  sessionType: routine.sessionType,
                  durationMin: routine.durationMin,
                  description: routine.description,
                  exercises: {
                    create: routine.exercises.map((re) => ({
                      exerciseId: re.exerciseId,
                      order: re.order,
                      block: re.block,
                      sets: re.sets,
                      reps: re.reps,
                      durationSec: re.durationSec,
                      restSec: re.restSec,
                      tempo: re.tempo,
                      rpe: re.rpe,
                      notes: re.notes,
                    })),
                  },
                })),
              },
            })),
          },
        },
        include: {
          phases: {
            include: {
              routines: {
                include: {
                  exercises: true,
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
            routines: {
              include: {
                exercises: {
                  include: {
                    exercise: true,
                  },
                },
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
