import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbUrl: string | undefined;
};

const currentUrl = process.env.DATABASE_URL;

// If database URL changed in .env, automatically disconnect old client and reconnect
if (globalForPrisma.prisma && globalForPrisma.prismaDbUrl !== currentUrl) {
  try {
    globalForPrisma.prisma.$disconnect();
  } catch (e) {
    // ignore
  }
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDbUrl = currentUrl;
}
