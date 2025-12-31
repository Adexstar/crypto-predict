-- Add AI Bot testing balance and subscription tracking columns to User table

-- Add testingBalance column (AI Bot testing funds - $2000 at signup)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "testingBalance" DOUBLE PRECISION NOT NULL DEFAULT 2000;

-- Add lastAISubDate column (for tracking last subscription date)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastAISubDate" TIMESTAMP(3);

-- Add aiSubCount column (for daily subscription counting)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiSubCount" INTEGER NOT NULL DEFAULT 0;
