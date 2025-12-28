-- Fix method column: set default on existing rows and ensure default for new inserts
-- This handles cases where method column was added without proper default

-- First, set default values for any existing NULL rows
UPDATE "Deposit" SET "method" = 'CRYPTO' WHERE "method" IS NULL;

-- Now ensure the column allows NULL with a DEFAULT (Prisma-friendly)
-- Drop constraint if it exists and recreate
DO $$
BEGIN
  -- Try to add default if it doesn't exist
  ALTER TABLE "Deposit" ALTER COLUMN "method" SET DEFAULT 'CRYPTO';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Make sure column is not required (allow NULL for Prisma compatibility)
-- but has a default so the database provides a value
DO $$
BEGIN
  ALTER TABLE "Deposit" ALTER COLUMN "method" DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Ensure column has a default
ALTER TABLE "Deposit" ALTER COLUMN "method" SET DEFAULT 'CRYPTO';
