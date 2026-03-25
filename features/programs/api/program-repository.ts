import type { Program } from "@prisma/client"
import type { CreateProgramBody } from "../schemas/program.schema"

export interface ProgramRepository {
  create(data: CreateProgramBody): Promise<Program>
  findAll(): Promise<Program[]>
  findById(id: string): Promise<Program | null>
  delete(id: string): Promise<void>
}
