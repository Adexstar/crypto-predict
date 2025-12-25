-- Fix Deposit and Withdrawal tables to match Prisma schema
-- This migration adds the missing columns that the current schema expects

-- Add missing columns to Deposit table
ALTER TABLE "Deposit" 
ADD COLUMN IF NOT EXISTS "network" TEXT,
ADD COLUMN IF NOT EXISTS "asset" TEXT,
ADD COLUMN IF NOT EXISTS "walletAddress" TEXT,
ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Add missing columns to Withdrawal table
ALTER TABLE "Withdrawal"
ADD COLUMN IF NOT EXISTS "walletAddress" TEXT,
ADD COLUMN IF NOT EXISTS "network" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

