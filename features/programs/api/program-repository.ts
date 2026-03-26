import type { Program } from "@prisma/client"
import type { CreateProgramBody } from "../schemas/program.schema"

export interface ProgramRepository {
  create(data: CreateProgramBody, userId: string): Promise<Program>
  findAll(userId: string): Promise<Program[]>
  findById(id: string, userId: string): Promise<Program | null>
  delete(id: string): Promise<void>
}
