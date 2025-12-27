-- Ensure all Deposit table columns exist for crypto transactions
ALTER TABLE "Deposit" 
ADD COLUMN IF NOT EXISTS "network" TEXT;

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "asset" TEXT;

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "confirmedAt" TIMESTAMP(3);

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

ALTER TABLE "Deposit"
ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

-- Ensure all Withdrawal table columns exist for crypto withdrawals
ALTER TABLE "Withdrawal"
ADD COLUMN IF NOT EXISTS "walletAddress" TEXT;

ALTER TABLE "Withdrawal"
ADD COLUMN IF NOT EXISTS "network" TEXT;

ALTER TABLE "Withdrawal"
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);

ALTER TABLE "Withdrawal"
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
