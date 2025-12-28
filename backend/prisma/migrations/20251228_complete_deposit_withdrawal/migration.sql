-- Complete Deposit and Withdrawal setup with all necessary fields for crypto deposits
-- Includes network, asset, walletAddress, and decision timestamps for admin panel

-- Deposit table: full crypto deposit tracking
CREATE TABLE IF NOT EXISTS "Deposit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CRYPTO',
    "network" TEXT,
    "asset" TEXT,
    "walletAddress" TEXT,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "confirmedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deposit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Withdrawal table: full withdrawal tracking with network support
CREATE TABLE IF NOT EXISTS "Withdrawal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CRYPTO',
    "network" TEXT,
    "walletAddress" TEXT,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Transfer table: internal account transfers (spot/futures/options)
CREATE TABLE IF NOT EXISTS "Transfer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAccount" TEXT NOT NULL,
    "toAccount" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Transfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS "Deposit_userId_idx" ON "Deposit"("userId");
CREATE INDEX IF NOT EXISTS "Deposit_status_idx" ON "Deposit"("status");
CREATE INDEX IF NOT EXISTS "Deposit_createdAt_idx" ON "Deposit"("createdAt");
CREATE INDEX IF NOT EXISTS "Withdrawal_userId_idx" ON "Withdrawal"("userId");
CREATE INDEX IF NOT EXISTS "Withdrawal_status_idx" ON "Withdrawal"("status");
CREATE INDEX IF NOT EXISTS "Withdrawal_createdAt_idx" ON "Withdrawal"("createdAt");
CREATE INDEX IF NOT EXISTS "Transfer_userId_idx" ON "Transfer"("userId");
CREATE INDEX IF NOT EXISTS "Transfer_createdAt_idx" ON "Transfer"("createdAt");

-- Add columns to existing tables if they don't exist
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "asset" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
