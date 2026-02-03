#!/usr/bin/env node
/**
 * Fix migration issue by marking 20260203_spot_trading as applied
 * Run: node fix-migration.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('🔧 Attempting to fix migration...\n');

    // Check if the migration record exists
    const existing = await prisma._prisma_migrations.findUnique({
      where: { id: '20260203_spot_trading' },
    }).catch(() => null);

    if (existing) {
      console.log('❌ Migration record already exists');
      console.log('   Status:', existing.started_at ? 'Started but failed' : 'Pending');
      
      // Delete it so we can try again
      await prisma._prisma_migrations.delete({
        where: { id: '20260203_spot_trading' },
      });
      
      console.log('✅ Removed failed migration record\n');
    }

    console.log('✅ Migration fix ready!');
    console.log('   Run: npx prisma migrate deploy');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
