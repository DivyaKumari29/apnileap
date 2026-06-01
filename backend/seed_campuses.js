const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const spokes = [
    { id: "3", name: "KLE Spoke", jiraBoardKey: "PNLP", isActive: true },
    { id: "101", name: "COEP Spoke", jiraBoardKey: "PNLP", isActive: true },
    { id: "102", name: "MMCOEP Spoke", jiraBoardKey: "PNLP", isActive: true },
    { id: "103", name: "RIT Spoke", jiraBoardKey: "PNLP", isActive: true }
  ];

  for (const spoke of spokes) {
    await prisma.campus.upsert({
      where: { id: spoke.id },
      update: {},
      create: spoke,
    });
  }
  console.log('Campuses seeded!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
