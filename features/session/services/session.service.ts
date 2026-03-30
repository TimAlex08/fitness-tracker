// features/session/services/session.service.ts
import type { CompletionStatus } from "@prisma/client"

export function calculateCompletionStatus(
  completedCount: number,
  total: number
): CompletionStatus {
  if (completedCount === 0) return "SKIPPED"
  if (completedCount === total) return "COMPLETED"
  return "PARTIAL"
}

export function parseRepsPerSet(repsPerSet: string | null | undefined): number[] {
  if (!repsPerSet) return []
  try {
    const parsed = JSON.parse(repsPerSet)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeRepsPerSet(reps: number[]): string {
  return JSON.stringify(reps)
}
