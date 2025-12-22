import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteNonAdminUsers() {
  try {
    // Delete all users except admins
    const result = await prisma.user.deleteMany({
      where: {
        role: 'USER'
      }
    });
    
    console.log(`✅ Deleted ${result.count} user accounts`);
    console.log('Admin accounts kept intact');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteNonAdminUsers();
