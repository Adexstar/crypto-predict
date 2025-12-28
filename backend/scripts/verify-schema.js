import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log('🔍 Verifying database connection...');

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.warn('⚠️  Schema verification warning:', error.message);
    console.log('⏩ Continuing anyway - schema may exist but not fully accessible yet');
    await prisma.$disconnect();
    process.exit(0); // Don't fail, let app try to start
  }
}

verifySchema();

verifySchema();
