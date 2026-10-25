import { prisma } from '../lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE;');
  console.log('Truncated User table successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
