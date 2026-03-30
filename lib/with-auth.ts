// lib/with-auth.ts
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export type AuthedRequest = NextRequest & { userId: string }

type AuthedHandler = (
  req: AuthedRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withAuth(handler: AuthedHandler) {
  return async (
    req: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    ;(req as AuthedRequest).userId = user.id
    return handler(req as AuthedRequest, context)
  }
}
