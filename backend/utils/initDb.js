import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function initializeDatabase() {
  try {
    console.log('Checking database tables...');
    
    // Try to query User table - if it fails, create all tables
    try {
      await prisma.user.findFirst();
      console.log('✓ Database tables already exist');
      return true;
    } catch (error) {
      if (error.code === 'P2021') {
        // Table doesn't exist
        console.log('Creating database tables...');
        await createAllTables();
        console.log('✓ Database tables created successfully');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
    throw error;
  }
}

async function createAllTables() {
  const sql = `
    -- Create User table
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT,
      "role" TEXT NOT NULL DEFAULT 'USER',
      "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "spotBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "futuresBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "optionsBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "frozen" BOOLEAN NOT NULL DEFAULT false,
      "kyc" BOOLEAN NOT NULL DEFAULT false,
      "kycLocked" BOOLEAN NOT NULL DEFAULT false,
      "vip" BOOLEAN NOT NULL DEFAULT false,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      "verificationCode" TEXT,
      "verificationCodeExpires" TIMESTAMP(3),
      "pendingRegistration" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastLoginAt" TIMESTAMP(3)
    );

    -- Create indexes for User
    CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
    CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

    -- Create History table
    CREATE TABLE IF NOT EXISTS "History" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "action" TEXT NOT NULL,
      "message" TEXT,
      "meta" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "History_userId_idx" ON "History"("userId");
    CREATE INDEX IF NOT EXISTS "History_action_idx" ON "History"("action");

    -- Create Deposit table
    CREATE TABLE IF NOT EXISTS "Deposit" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "details" JSONB,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "Deposit_userId_idx" ON "Deposit"("userId");
    CREATE INDEX IF NOT EXISTS "Deposit_status_idx" ON "Deposit"("status");

    -- Create Withdrawal table
    CREATE TABLE IF NOT EXISTS "Withdrawal" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "amount" DOUBLE PRECISION NOT NULL,
      "method" TEXT NOT NULL,
      "details" JSONB,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "Withdrawal_userId_idx" ON "Withdrawal"("userId");
    CREATE INDEX IF NOT EXISTS "Withdrawal_status_idx" ON "Withdrawal"("status");

    -- Create SupportTicket table
    CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'open',
      "priority" TEXT NOT NULL DEFAULT 'medium',
      "replies" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx" ON "SupportTicket"("userId");
    CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx" ON "SupportTicket"("status");

    -- Create Announcement table
    CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'info',
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Execute raw SQL
  const statements = sql.split(';').filter(stmt => stmt.trim());
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists')) {
          console.error('SQL Error:', error.message);
          throw error;
        }
      }
    }
  }
}
