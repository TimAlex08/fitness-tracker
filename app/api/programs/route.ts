import { NextRequest, NextResponse } from "next/server"
import { PrismaProgramRepository } from "@/features/programs/api/prisma-program-repository"
import { getSession } from "@/lib/auth"
import { apiError } from "@/lib/api-error"

const repo = new PrismaProgramRepository()

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    const collections = await repo.getCollections(user.id)
    return NextResponse.json(collections)
  } catch (error) {
    console.error("[GET /api/programs]", error)
    return apiError("Error al obtener programas", 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) return apiError("Unauthorized", 401)

    // TODO(Plan C): Implement Collection/Program creation
    return apiError("Not implemented", 501)
  } catch (error: unknown) {
    console.error("[POST /api/programs]", error)
    return apiError("Error al crear el programa", 500)
  }
}