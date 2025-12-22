import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node get-verification-code.js <email>');
    process.exit(2);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    console.log(user.verificationCode || '');
  } catch (e) {
    console.error('Error:', e);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
}

run();
