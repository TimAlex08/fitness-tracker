// features/training/api/training-repository.ts
import type { WeekData, MonthData, YearData } from "../types/training.types"

export interface TrainingRepository {
  getWeekData(date: Date, userId: string): Promise<WeekData>
  getMonthData(year: number, month: number, userId: string): Promise<MonthData>
  getYearData(year: number, userId: string): Promise<YearData>
}
