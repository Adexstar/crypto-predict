import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error('Usage: node delete-user.js <email>');
  process.exit(1);
}

async function run() {
  try {
    const result = await prisma.user.deleteMany({ where: { email } });
    console.log(`Deleted ${result.count} user(s) with email=${email}`);
  } catch (e) {
    console.error('Error:', e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

run();
