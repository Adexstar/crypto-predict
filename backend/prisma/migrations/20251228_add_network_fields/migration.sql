-- Add missing columns to Deposit
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "asset" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "Deposit" ADD COLUMN IF NOT EXISTS "method" TEXT NOT NULL DEFAULT 'CRYPTO';

-- Add missing columns to Withdrawal
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "network" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP;
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP;

-- Create Transfer table if it does not exist
CREATE TABLE IF NOT EXISTS "Transfer" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "fromAccount" TEXT NOT NULL,
  "toAccount" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Transfer
CREATE INDEX IF NOT EXISTS "Transfer_userId_idx" ON "Transfer" ("userId");
CREATE INDEX IF NOT EXISTS "Transfer_createdAt_idx" ON "Transfer" ("createdAt");
