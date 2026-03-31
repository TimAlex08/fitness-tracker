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

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('MAIN_PATH', 'VARIANT');

-- CreateEnum
CREATE TYPE "ScheduleOverrideType" AS ENUM ('MOVED', 'CANCELLED', 'ADDED');

-- CreateEnum
CREATE TYPE "SessionSource" AS ENUM ('SCHEDULED', 'AD_HOC');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "familyId" TEXT,
    "familyLevel" INTEGER,
    "familyRole" "FamilyRole",
    "defaultSets" INTEGER,
    "defaultReps" INTEGER,
    "defaultDurationSec" INTEGER,
    "defaultRestSec" INTEGER NOT NULL DEFAULT 60,
    "defaultTempo" TEXT,
    "defaultRpe" INTEGER,
    "jointStress" "JointStress" NOT NULL DEFAULT 'LOW',
    "targetJoints" TEXT,
    "contraindications" TEXT,
    "safetyNotes" TEXT,
    "bodyweightPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sessionType" "SessionType" NOT NULL,
    "durationMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_exercise" (
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

    CONSTRAINT "routine_exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "rpeTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_routine" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "recurrenceDays" TEXT[],
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_override" (
    "id" TEXT NOT NULL,
    "programRoutineId" TEXT NOT NULL,
    "type" "ScheduleOverrideType" NOT NULL,
    "originalDate" TIMESTAMP(3),
    "newDate" TIMESTAMP(3),
    "routineId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_override_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "routineId" TEXT,
    "source" "SessionSource" NOT NULL DEFAULT 'SCHEDULED',
    "status" "CompletionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "durationMin" INTEGER,
    "overallRpe" INTEGER,
    "energyLevel" INTEGER,
    "sleepHours" DOUBLE PRECISION,
    "sleepQuality" INTEGER,
    "bodyWeight" DOUBLE PRECISION,
    "mood" INTEGER,
    "painLevel" INTEGER,
    "painNotes" TEXT,
    "notes" TEXT,
    "watchHrAvg" INTEGER,
    "watchHrMax" INTEGER,
    "watchCalories" INTEGER,
    "watchActiveMinutes" INTEGER,
    "watchSpO2" INTEGER,
    "watchStressScore" INTEGER,
    "watchHrZones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_log" (
    "id" TEXT NOT NULL,
    "dailyLogId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "setsCompleted" INTEGER,
    "repsPerSet" TEXT,
    "durationSec" INTEGER,
    "holdTimeSec" TEXT,
    "rpeActual" INTEGER,
    "formQuality" "FormQuality",
    "painDuring" INTEGER,
    "usedRegression" BOOLEAN NOT NULL DEFAULT false,
    "regressionNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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

    CONSTRAINT "body_measurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_family_slug_key" ON "exercise_family"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_slug_key" ON "exercise"("slug");

-- CreateIndex
CREATE INDEX "exercise_muscleGroup_idx" ON "exercise"("muscleGroup");

-- CreateIndex
CREATE INDEX "exercise_category_idx" ON "exercise"("category");

-- CreateIndex
CREATE INDEX "exercise_familyId_idx" ON "exercise"("familyId");

-- CreateIndex
CREATE INDEX "routine_userId_idx" ON "routine"("userId");

-- CreateIndex
CREATE INDEX "routine_exercise_routineId_idx" ON "routine_exercise"("routineId");

-- CreateIndex
CREATE UNIQUE INDEX "routine_exercise_routineId_order_key" ON "routine_exercise"("routineId", "order");

-- CreateIndex
CREATE INDEX "collection_userId_idx" ON "collection"("userId");

-- CreateIndex
CREATE INDEX "program_collectionId_idx" ON "program"("collectionId");

-- CreateIndex
CREATE INDEX "program_routine_programId_idx" ON "program_routine"("programId");

-- CreateIndex
CREATE INDEX "program_routine_routineId_idx" ON "program_routine"("routineId");

-- CreateIndex
CREATE INDEX "schedule_override_programRoutineId_idx" ON "schedule_override"("programRoutineId");

-- CreateIndex
CREATE INDEX "daily_log_userId_idx" ON "daily_log"("userId");

-- CreateIndex
CREATE INDEX "daily_log_date_idx" ON "daily_log"("date");

-- CreateIndex
CREATE INDEX "daily_log_status_idx" ON "daily_log"("status");

-- CreateIndex
CREATE UNIQUE INDEX "daily_log_userId_date_routineId_key" ON "daily_log"("userId", "date", "routineId");

-- CreateIndex
CREATE INDEX "exercise_log_dailyLogId_idx" ON "exercise_log"("dailyLogId");

-- CreateIndex
CREATE INDEX "exercise_log_exerciseId_idx" ON "exercise_log"("exerciseId");

-- CreateIndex
CREATE INDEX "exercise_log_createdAt_idx" ON "exercise_log"("createdAt");

-- CreateIndex
CREATE INDEX "body_measurement_date_idx" ON "body_measurement"("date");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "exercise_family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine" ADD CONSTRAINT "routine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_exercise" ADD CONSTRAINT "routine_exercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program" ADD CONSTRAINT "program_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_routine" ADD CONSTRAINT "program_routine_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_routine" ADD CONSTRAINT "program_routine_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_override" ADD CONSTRAINT "schedule_override_programRoutineId_fkey" FOREIGN KEY ("programRoutineId") REFERENCES "program_routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log" ADD CONSTRAINT "daily_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_log" ADD CONSTRAINT "daily_log_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_dailyLogId_fkey" FOREIGN KEY ("dailyLogId") REFERENCES "daily_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_log" ADD CONSTRAINT "exercise_log_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "body_measurement" ADD CONSTRAINT "body_measurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
