const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  const deleted = await prisma.user.deleteMany({
    where: {
      role: 'MENTOR'
    }
  });
  console.log('Deleted old mentors:', deleted.count);
}
clean().finally(() => prisma.$disconnect());
