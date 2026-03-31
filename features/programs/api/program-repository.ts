// features/programs/api/program-repository.ts
import type { CollectionWithPrograms, ProgramWithRoutines } from "@/types"

export interface ProgramRepository {
  getActiveProgram(userId: string): Promise<ProgramWithRoutines | null>
  getCollections(userId: string): Promise<CollectionWithPrograms[]>
  getCollection(id: string, userId: string): Promise<CollectionWithPrograms | null>
  getProgram(id: string): Promise<ProgramWithRoutines | null>
}