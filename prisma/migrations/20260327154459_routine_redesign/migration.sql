/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `Routine` table. All the data in the column will be lost.
  - You are about to drop the column `phaseId` on the `Routine` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[routineId,order]` on the table `RoutineExercise` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Routine` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Routine" DROP CONSTRAINT "Routine_phaseId_fkey";

-- DropIndex
DROP INDEX "RoutineExercise_routineId_exerciseId_order_key";

-- AlterTable
ALTER TABLE "Routine" DROP COLUMN "dayOfWeek",
DROP COLUMN "phaseId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "weekNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseOverride" (
    "id" TEXT NOT NULL,
    "programDayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,
    "tempo" TEXT,
    "rpe" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ExerciseOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramDay_phaseId_idx" ON "ProgramDay"("phaseId");

-- CreateIndex
CREATE INDEX "ProgramDay_routineId_idx" ON "ProgramDay"("routineId");

-- CreateIndex
CREATE INDEX "ExerciseOverride_programDayId_idx" ON "ExerciseOverride"("programDayId");

-- CreateIndex
CREATE INDEX "Routine_userId_idx" ON "Routine"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineExercise_routineId_order_key" ON "RoutineExercise"("routineId", "order");

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseOverride" ADD CONSTRAINT "ExerciseOverride_programDayId_fkey" FOREIGN KEY ("programDayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseOverride" ADD CONSTRAINT "ExerciseOverride_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
