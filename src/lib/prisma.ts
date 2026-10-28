import { PrismaClient } from '@prisma/client';

// Direct IPv4 Neon endpoint (works reliably across all environments including Windows & Vercel)
const NEON_IPV4_URL =
  'postgresql://neondb_owner:npg_FgPm15xEinMu@52.72.93.132:5432/neondb?sslmode=require&options=endpoint%3Dep-wandering-art-b8ueg8zp-pooler';

function getDatabaseUrl(): string {
  // 1. If Vercel provided Neon integration env vars:
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;

  const envUrl = process.env.DATABASE_URL;

  // 2. In production (e.g. Vercel), if DATABASE_URL contains localhost, it's invalid -> redirect to Neon
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (isProduction && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    console.warn('⚠️ [Prisma] Production environment detected with localhost DB URL. Redirecting to Neon Cloud Database...');
    return NEON_IPV4_URL;
  }

  // 3. Use DATABASE_URL from .env or fallback to Neon
  return envUrl || NEON_IPV4_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbUrl: string | undefined;
};

const activeUrl = getDatabaseUrl();

// If database URL changed, disconnect old client and reconnect
if (globalForPrisma.prisma && globalForPrisma.prismaDbUrl !== activeUrl) {
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
    datasources: {
      db: {
        url: activeUrl,
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDbUrl = activeUrl;
}
