/*
  Warnings:

  - The `status` column on the `DailyLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `jointStress` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[date,routineId]` on the table `DailyLog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `movementType` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `muscleGroup` on the `Exercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Exercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'CORE', 'MOBILITY', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('PUSH', 'PULL', 'SQUAT', 'HINGE', 'CARRY', 'ISOMETRIC', 'MOBILITY', 'ACTIVATION');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('STANDARD', 'REGRESSION', 'PROGRESSION', 'PREHAB', 'WARMUP', 'COOLDOWN');

-- CreateEnum
CREATE TYPE "JointStress" AS ENUM ('NONE', 'LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('TRAINING', 'MOBILITY', 'REST', 'DELOAD');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('PENDING', 'COMPLETED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "FormQuality" AS ENUM ('PERFECT', 'GOOD', 'FAIR', 'POOR');

-- DropIndex
DROP INDEX "DailyLog_date_key";

-- AlterTable
ALTER TABLE "DailyLog" ADD COLUMN     "bodyWeight" DOUBLE PRECISION,
ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "isFreeSession" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mood" INTEGER,
ADD COLUMN     "painLevel" INTEGER,
ADD COLUMN     "painNotes" TEXT,
ADD COLUMN     "routineId" TEXT,
ADD COLUMN     "sleepQuality" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "watchActiveMinutes" INTEGER,
ADD COLUMN     "watchCalories" INTEGER,
ADD COLUMN     "watchHrAvg" INTEGER,
ADD COLUMN     "watchHrMax" INTEGER,
ADD COLUMN     "watchHrZones" TEXT,
ADD COLUMN     "watchSpO2" INTEGER,
ADD COLUMN     "watchStressScore" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "CompletionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "bodyweightPercent" DOUBLE PRECISION,
ADD COLUMN     "contraindications" TEXT,
ADD COLUMN     "difficulty" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "movementType" "MovementType" NOT NULL,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videoUrl" TEXT,
DROP COLUMN "muscleGroup",
ADD COLUMN     "muscleGroup" "MuscleGroup" NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "ExerciseCategory" NOT NULL,
DROP COLUMN "jointStress",
ADD COLUMN     "jointStress" "JointStress" NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "ExerciseLog" ADD COLUMN     "durationSec" INTEGER,
ADD COLUMN     "formQuality" "FormQuality",
ADD COLUMN     "holdTimeSec" TEXT,
ADD COLUMN     "painDuring" INTEGER,
ADD COLUMN     "regressionNote" TEXT,
ADD COLUMN     "usedRegression" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phase" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weekStart" INTEGER NOT NULL,
    "weekEnd" INTEGER NOT NULL,
    "description" TEXT,
    "rpeTarget" TEXT,
    "tempoDefault" TEXT,
    "benchmarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" TEXT,
    "sessionType" "SessionType" NOT NULL,
    "durationMin" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "block" TEXT,
    "sets" INTEGER,
    "reps" INTEGER,
    "durationSec" INTEGER,
    "restSec" INTEGER,
    "tempo" TEXT,
    "rpe" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION,
    "waistCm" DOUBLE PRECISION,
    "hipCm" DOUBLE PRECISION,
    "chestCm" DOUBLE PRECISION,
    "armCm" DOUBLE PRECISION,
    "thighCm" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineExercise_routineId_idx" ON "RoutineExercise"("routineId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineExercise_routineId_exerciseId_order_key" ON "RoutineExercise"("routineId", "exerciseId", "order");

-- CreateIndex
CREATE INDEX "BodyMeasurement_date_idx" ON "BodyMeasurement"("date");

-- CreateIndex
CREATE INDEX "DailyLog_date_idx" ON "DailyLog"("date");

-- CreateIndex
CREATE INDEX "DailyLog_status_idx" ON "DailyLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_routineId_key" ON "DailyLog"("date", "routineId");

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");

-- CreateIndex
CREATE INDEX "Exercise_category_idx" ON "Exercise"("category");

-- CreateIndex
CREATE INDEX "Exercise_parentId_idx" ON "Exercise"("parentId");

-- CreateIndex
CREATE INDEX "ExerciseLog_dailyLogId_idx" ON "ExerciseLog"("dailyLogId");

-- CreateIndex
CREATE INDEX "ExerciseLog_exerciseId_idx" ON "ExerciseLog"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseLog_createdAt_idx" ON "ExerciseLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Phase" ADD CONSTRAINT "Phase_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routine" ADD CONSTRAINT "Routine_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyLog" ADD CONSTRAINT "DailyLog_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
