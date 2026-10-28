import net from 'net';
import dns from 'dns';
import { PrismaClient } from '@prisma/client';

const DDL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'OM NAMASIVAYAM PACKAGING',
    "financialYear" TEXT NOT NULL DEFAULT '2026-2027',
    "currencySymbol" TEXT NOT NULL DEFAULT '₹',
    "lowStockThresholdKg" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "canViewDashboard" BOOLEAN NOT NULL DEFAULT true,
    "canViewRegister" BOOLEAN NOT NULL DEFAULT true,
    "canViewPrices" BOOLEAN NOT NULL DEFAULT false,
    "canInwardReels" BOOLEAN NOT NULL DEFAULT false,
    "canIssueReels" BOOLEAN NOT NULL DEFAULT false,
    "canViewSheets" BOOLEAN NOT NULL DEFAULT true,
    "canPrintLabels" BOOLEAN NOT NULL DEFAULT false,
    "canViewReports" BOOLEAN NOT NULL DEFAULT false,
    "canManageSettings" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteReels" BOOLEAN NOT NULL DEFAULT false,
    "canAccessAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roleName" TEXT NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE TABLE IF NOT EXISTS "Reel" (
    "id" TEXT NOT NULL,
    "reelNo" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'KRAFT_REEL',
    "category" TEXT NOT NULL,
    "sizeDesc" TEXT NOT NULL,
    "sizeValue" DOUBLE PRECISION,
    "sizeUnit" TEXT NOT NULL DEFAULT 'CM',
    "gsm" INTEGER NOT NULL,
    "bf" INTEGER,
    "weight" DOUBLE PRECISION NOT NULL,
    "usedWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceWeight" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reelAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "millName" TEXT NOT NULL,
    "bayLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "inwardDate" TEXT NOT NULL,
    "usedDate" TEXT,
    "financialYear" TEXT NOT NULL DEFAULT '2026-2027',
    "isSheet" BOOLEAN NOT NULL DEFAULT false,
    "sheetCount" INTEGER,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Reel_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE TABLE IF NOT EXISTS "ConsumptionLog" (
    "id" TEXT NOT NULL,
    "reelId" TEXT NOT NULL,
    "reelNo" TEXT NOT NULL,
    "consumedWeight" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "pricePerKg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consumedDate" TEXT NOT NULL,
    "machineId" TEXT,
    "jobOrderNo" TEXT,
    "recordedBy" TEXT NOT NULL DEFAULT 'Operator',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConsumptionLog_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "user" TEXT NOT NULL DEFAULT 'Admin',
    "oldValues" TEXT,
    "newValues" TEXT,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  );`,

  `CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Reel_reelNo_key" ON "Reel"("reelNo");`,

  `DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_roleName_fkey') THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_roleName_fkey" FOREIGN KEY ("roleName") REFERENCES "Role"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ConsumptionLog_reelId_fkey') THEN
          ALTER TABLE "ConsumptionLog" ADD CONSTRAINT "ConsumptionLog_reelId_fkey" FOREIGN KEY ("reelId") REFERENCES "Reel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
  END $$;`,
];

async function resolveIpv4(hostname: string): Promise<string> {
  return new Promise((resolve) => {
    dns.resolve4(hostname, (err, addrs) => {
      if (err || !addrs || addrs.length === 0) {
        resolve('52.72.93.132'); // Known Neon US-East AWS IPv4
      } else {
        resolve(addrs[0]);
      }
    });
  });
}

function parseNeonUrl(rawUrl: string) {
  const match = rawUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^/:]+)(?::(\d+))?\/([^?]+)/);
  if (!match) {
    throw new Error('Invalid PostgreSQL URL format.');
  }
  const [, user, password, host, , database] = match;
  const endpoint = host.split('.')[0];
  return { user, password, host, database, endpoint };
}

async function main() {
  const inputUrl =
    process.argv[2] ||
    process.env.NEON_DATABASE_URL ||
    'postgresql://neondb_owner:npg_FgPm15xEinMu@ep-wandering-art-b8ueg8zp-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require';

  const { user, password, host, database, endpoint } = parseNeonUrl(inputUrl);

  console.log('====================================================');
  console.log('🚀 MIGRATING LOCAL POSTGRESQL DATA TO NEON CLOUD');
  console.log('====================================================');
  console.log(`Neon Host: ${host}`);
  console.log(`Endpoint : ${endpoint}`);

  const targetIp = await resolveIpv4(host);
  console.log(`Connecting via IPv4: ${targetIp}`);

  // Create IPv4 TCP Bridge on port 5433
  const bridgePort = 5433;
  const server = net.createServer((clientSocket) => {
    const upstream = net.createConnection({ host: targetIp, port: 5432 }, () => {
      clientSocket.pipe(upstream);
      upstream.pipe(clientSocket);
    });
    upstream.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => upstream.destroy());
  });

  await new Promise<void>((resolve) => server.listen(bridgePort, '127.0.0.1', () => resolve()));
  console.log(`✅ IPv4 Bridge active on 127.0.0.1:${bridgePort}\n`);

  const localUrl = process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/paper_reel_db?schema=public';
  const neonBridgeUrl = `postgresql://${user}:${password}@127.0.0.1:${bridgePort}/${database}?sslmode=require&options=endpoint%3D${endpoint}`;

  const localPrisma = new PrismaClient({
    datasources: { db: { url: localUrl } },
  });

  const neonPrisma = new PrismaClient({
    datasources: { db: { url: neonBridgeUrl } },
  });

  try {
    // Phase 1: Apply DDL (Create all tables in public schema)
    console.log('🔨 Phase 1: Creating tables and schema in Neon (public schema)...');
    for (const sql of DDL_STATEMENTS) {
      await neonPrisma.$executeRawUnsafe(sql);
    }
    console.log('✅ All tables and indexes are ready on Neon!\n');

    // Phase 2: Migrate Data
    console.log('📦 Phase 2: Transferring data from local PostgreSQL to Neon...');

    // 1. Settings
    const settings = await localPrisma.setting.findMany();
    for (const s of settings) {
      await neonPrisma.setting.upsert({
        where: { id: s.id },
        update: s,
        create: s,
      });
    }
    console.log(`   ✅ 1/6 Transferred ${settings.length} Setting records`);

    // 2. Roles
    const roles = await localPrisma.role.findMany();
    for (const r of roles) {
      await neonPrisma.role.upsert({
        where: { name: r.name },
        update: r,
        create: r,
      });
    }
    console.log(`   ✅ 2/6 Transferred ${roles.length} Roles`);

    // 3. Users
    const users = await localPrisma.user.findMany();
    for (const u of users) {
      await neonPrisma.user.upsert({
        where: { username: u.username },
        update: u,
        create: u,
      });
    }
    console.log(`   ✅ 3/6 Transferred ${users.length} Users`);

    // 4. Reels
    const reels = await localPrisma.reel.findMany();
    for (const r of reels) {
      await neonPrisma.reel.upsert({
        where: { reelNo: r.reelNo },
        update: r,
        create: r,
      });
    }
    console.log(`   ✅ 4/6 Transferred ${reels.length} Reels`);

    // 5. Consumption Logs
    const logs = await localPrisma.consumptionLog.findMany();
    for (const l of logs) {
      await neonPrisma.consumptionLog.upsert({
        where: { id: l.id },
        update: l,
        create: l,
      });
    }
    console.log(`   ✅ 5/6 Transferred ${logs.length} Consumption Logs`);

    // 6. Audit Logs
    const audits = await localPrisma.auditLog.findMany();
    for (const a of audits) {
      await neonPrisma.auditLog.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }
    console.log(`   ✅ 6/6 Transferred ${audits.length} Audit Logs`);

    // Verification
    const neonReelCount = await neonPrisma.reel.count();
    const agg = await neonPrisma.reel.aggregate({
      _sum: { weight: true, balanceWeight: true, reelAmount: true, balanceAmount: true },
    });

    console.log('\n====================================================');
    console.log('🎉 VERIFICATION: NEON DATABASE SUMMARY');
    console.log('====================================================');
    console.log(`Total Reels in Neon: ${neonReelCount}`);
    console.log(`Total Weight       : ${agg._sum.weight} KG`);
    console.log(`Available Balance  : ${agg._sum.balanceWeight} KG`);
    console.log(`Total Valuation    : ₹${agg._sum.reelAmount}`);
    console.log(`Balance Valuation  : ₹${agg._sum.balanceAmount}`);
    console.log('====================================================');
    console.log('🌟 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('You can now open your Vercel link and switch schema to "public"!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n❌ Migration failed:', err.message || err);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
    server.close();
  }
}

main();
