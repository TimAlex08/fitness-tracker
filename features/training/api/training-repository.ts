import type { WeekData, MonthData, YearData } from "@/features/training/types/training.types"

export interface TrainingRepository {
  getWeekData(date: Date): Promise<WeekData>
  getMonthData(year: number, month: number): Promise<MonthData>
  getYearData(year: number): Promise<YearData>
}
