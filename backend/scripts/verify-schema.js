import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...');

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK');

    // Check if Deposit table exists and has required columns
    const depositColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Deposit'
    `;
    
    console.log('📋 Deposit columns:', depositColumns.map(c => c.column_name));

    // Ensure critical columns exist
    const requiredColumns = {
      'Deposit': ['id', 'userId', 'amount', 'status', 'method', 'createdAt'],
      'Withdrawal': ['id', 'userId', 'amount', 'status', 'createdAt'],
      'Transfer': ['id', 'userId', 'fromAccount', 'toAccount', 'amount', 'createdAt']
    };

    for (const [table, columns] of Object.entries(requiredColumns)) {
      const tableColumns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = ${table}
      `;
      
      const existingCols = tableColumns.map(c => c.column_name);
      const missing = columns.filter(col => !existingCols.includes(col));
      
      if (missing.length > 0) {
        console.warn(`⚠️  ${table} missing columns:`, missing);
      } else {
        console.log(`✅ ${table} has all required columns`);
      }
    }

    console.log('✅ Schema verification complete');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verifySchema();
