import type { ProgressData } from "../types/progress.types"

export interface ProgressRepository {
  getProgressData(userId: string): Promise<ProgressData>
}
