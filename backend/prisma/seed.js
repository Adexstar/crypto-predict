import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin!2024', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@24htrading.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@24htrading.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      balance: 0,
      spotBalance: 0,
      futuresBalance: 0,
      optionsBalance: 0,
      kyc: true,
      vip: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create demo users
  const demoPassword = await bcrypt.hash('demo123', 10);
  
  const demoUsers = [
    {
      email: 'alice@test.local',
      name: 'Alice',
      balance: 10000,
      spotBalance: 6000,
      futuresBalance: 3000,
      optionsBalance: 1000,
    },
    {
      email: 'bob@test.local',
      name: 'Bob',
      balance: 2500,
      spotBalance: 1500,
      futuresBalance: 750,
      optionsBalance: 250,
    },
    {
      email: 'carol@test.local',
      name: 'Carol',
      balance: 50000,
      spotBalance: 30000,
      futuresBalance: 15000,
      optionsBalance: 5000,
      kyc: true,
      vip: true,
    },
  ];

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: demoPassword,
        role: 'USER',
      },
    });
    console.log('✅ Demo user created:', user.email);
  }

  // Create sample announcement
  await prisma.announcement.create({
    data: {
      title: 'Welcome to 24h Trading Platform',
      content: 'Start trading with advanced features and professional support.',
      type: 'INFO',
    },
  });

  console.log('✅ Sample announcement created');
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
