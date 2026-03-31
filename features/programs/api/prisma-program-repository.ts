// features/programs/api/prisma-program-repository.ts
import { prisma } from "@/lib/prisma"
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"
import type { ProgramRepository } from "./program-repository"

export class PrismaProgramRepository implements ProgramRepository {
  async getActiveProgram(userId: string): Promise<ProgramWithRoutines | null> {
    const collection = await prisma.collection.findFirst({
      where: { userId, isActive: true },
      include: { programs: { where: { isActive: true }, take: 1 } },
    })
    if (!collection?.programs[0]) return null
    return this.getProgram(collection.programs[0].id)
  }

  async getCollections(userId: string): Promise<CollectionWithPrograms[]> {
    return prisma.collection.findMany({
      where: { userId },
      include: { programs: true },
      orderBy: { createdAt: "desc" },
    })
  }

  async getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null> {
    return prisma.collection.findFirst({
      where: { id, userId },
      include: { programs: true },
    })
  }

  async getProgram(id: string): Promise<ProgramWithRoutines | null> {
    return prisma.program.findUnique({
      where: { id },
      include: {
        programRoutines: {
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
    })
  }
}