const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  // KLE Spoke Mentors (campusId: "3")
  await prisma.user.upsert({
    where: { email: 'kle-mentor1@apnileap.com' },
    update: {},
    create: { email: 'kle-mentor1@apnileap.com', password, name: 'Dr. Ramesh (KLE)', role: 'MENTOR', campusId: '3' },
  });
  await prisma.user.upsert({
    where: { email: 'kle-mentor2@apnileap.com' },
    update: {},
    create: { email: 'kle-mentor2@apnileap.com', password, name: 'Prof. Geetha (KLE)', role: 'MENTOR', campusId: '3' },
  });

  // COEP Spoke Mentors (campusId: "101")
  await prisma.user.upsert({
    where: { email: 'coep-mentor@apnileap.com' },
    update: {},
    create: { email: 'coep-mentor@apnileap.com', password, name: 'Dr. Patil (COEP)', role: 'MENTOR', campusId: '101' },
  });

  console.log('Mentors seeded successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
