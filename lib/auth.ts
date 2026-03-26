import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { cookies } from "next/headers"

export const SESSION_COOKIE = "session_token"
const SESSION_DAYS = 30

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)
  await prisma.session.create({ data: { token, userId, expiresAt } })
  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { token } })
    return null
  }

  return session.user
}

export async function deleteSession(token: string) {
  await prisma.session.delete({ where: { token } }).catch(() => null)
}

export function sessionCookieOptions(token: string) {
  const expires = new Date()
  expires.setDate(expires.getDate() + SESSION_DAYS)
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  }
}
