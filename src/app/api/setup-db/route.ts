import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * Cloud Database Initialization Endpoint
 * When a cloud PostgreSQL database (Neon, Supabase, Vercel Postgres) is connected to Vercel,
 * visiting /api/setup-db automatically initializes the database tables and seeds
 * the system roles, default users, and all 60 Excel paper reels.
 */
export async function GET() {
  const log: string[] = [];

  try {
    log.push(`Checking database connection...`);

    // 1. Create tables if needed using raw DDL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Role" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "roleName" TEXT NOT NULL DEFAULT 'OPERATOR' REFERENCES "Role"("name") ON DELETE RESTRICT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Reel" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reelNo" TEXT NOT NULL UNIQUE,
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
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ConsumptionLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reelId" TEXT NOT NULL REFERENCES "Reel"("id") ON DELETE CASCADE,
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
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "action" TEXT NOT NULL,
        "entityName" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "details" TEXT NOT NULL,
        "user" TEXT NOT NULL DEFAULT 'Admin',
        "oldValues" TEXT,
        "newValues" TEXT
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Setting" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "companyName" TEXT NOT NULL DEFAULT 'OM NAMASIVAYAM PACKAGING',
        "financialYear" TEXT NOT NULL DEFAULT '2026-2027',
        "currencySymbol" TEXT NOT NULL DEFAULT '₹',
        "lowStockThresholdKg" DOUBLE PRECISION NOT NULL DEFAULT 1000
      );
    `);

    log.push('Database tables verified / created successfully.');

    // 2. Seed System Roles
    const systemRoles = [
      {
        name: 'ADMIN',
        displayName: 'Admin / Factory Owner',
        description: 'Complete operational, rate calculation, user management, and database control.',
        isSystem: true,
        canViewDashboard: true,
        canViewRegister: true,
        canViewPrices: true,
        canInwardReels: true,
        canIssueReels: true,
        canViewSheets: true,
        canPrintLabels: true,
        canViewReports: true,
        canManageSettings: true,
        canDeleteReels: true,
        canAccessAdmin: true,
      },
      {
        name: 'ACCOUNTANT',
        displayName: 'Chief Accountant',
        description: 'Financial visibility, inventory valuations, and audit reports.',
        isSystem: true,
        canViewDashboard: true,
        canViewRegister: true,
        canViewPrices: true,
        canInwardReels: false,
        canIssueReels: false,
        canViewSheets: true,
        canPrintLabels: false,
        canViewReports: true,
        canManageSettings: false,
        canDeleteReels: false,
        canAccessAdmin: false,
      },
      {
        name: 'STOREKEEPER',
        displayName: 'Store Incharge',
        description: 'Raw material inward, warehouse bay placement, and QR barcode labels. Rates masked.',
        isSystem: true,
        canViewDashboard: true,
        canViewRegister: true,
        canViewPrices: false,
        canInwardReels: true,
        canIssueReels: true,
        canViewSheets: true,
        canPrintLabels: true,
        canViewReports: false,
        canManageSettings: false,
        canDeleteReels: false,
        canAccessAdmin: false,
      },
      {
        name: 'OPERATOR',
        displayName: 'Machine Operator',
        description: 'Record paper reel consumption on corrugator lines. Rates and reports restricted.',
        isSystem: true,
        canViewDashboard: true,
        canViewRegister: true,
        canViewPrices: false,
        canInwardReels: false,
        canIssueReels: true,
        canViewSheets: true,
        canPrintLabels: false,
        canViewReports: false,
        canManageSettings: false,
        canDeleteReels: false,
        canAccessAdmin: false,
      },
    ];

    for (const r of systemRoles) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: r,
        create: r,
      });
    }
    log.push(`4 System roles upserted in PostgreSQL.`);

    // 3. Seed Default Users
    const defaultUsers = [
      { username: 'admin', fullName: 'Sivakumar (Factory Admin)', pass: 'admin123', roleName: 'ADMIN' },
      { username: 'accountant', fullName: 'Ramesh (Chief Accountant)', pass: 'account123', roleName: 'ACCOUNTANT' },
      { username: 'store', fullName: 'Murugan (Store Incharge)', pass: 'store123', roleName: 'STOREKEEPER' },
      { username: 'operator', fullName: 'Senthil (Line Operator)', pass: 'operator123', roleName: 'OPERATOR' },
    ];

    for (const u of defaultUsers) {
      await prisma.user.upsert({
        where: { username: u.username },
        update: {
          fullName: u.fullName,
          roleName: u.roleName,
          isActive: true,
          passwordHash: hashPassword(u.pass),
        },
        create: {
          username: u.username,
          fullName: u.fullName,
          roleName: u.roleName,
          isActive: true,
          passwordHash: hashPassword(u.pass),
        },
      });
    }
    log.push(`4 Default users seeded (admin, accountant, store, operator).`);

    // 4. Seed Reels from JSON if table is empty
    const reelCount = await prisma.reel.count();
    let seededReels = 0;
    if (reelCount === 0) {
      const dataFilePath = path.join(process.cwd(), 'data', 'paper_reel_db.json');
      if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed.reels)) {
          for (const r of parsed.reels) {
            await prisma.reel.create({
              data: {
                reelNo: r.reelNo,
                itemType: r.itemType || 'KRAFT_REEL',
                category: r.category,
                sizeDesc: r.sizeDesc,
                sizeValue: r.sizeValue ? Number(r.sizeValue) : null,
                sizeUnit: r.sizeUnit || 'CM',
                gsm: Number(r.gsm) || 120,
                bf: r.bf ? Number(r.bf) : null,
                weight: Number(r.weight) || 0,
                usedWeight: Number(r.usedWeight) || 0,
                balanceWeight: Number(r.balanceWeight) || 0,
                pricePerKg: Number(r.pricePerKg) || 0,
                reelAmount: Number(r.reelAmount) || 0,
                consumedAmount: Number(r.consumedAmount) || 0,
                balanceAmount: Number(r.balanceAmount) || 0,
                millName: r.millName || 'UNKNOWN',
                bayLocation: r.bayLocation || null,
                status: r.status || 'IN_STOCK',
                inwardDate: r.inwardDate || '2026-10-25',
                financialYear: r.financialYear || '2026-2027',
                isSheet: Boolean(r.isSheet),
                remarks: r.remarks || null,
              },
            });
            seededReels++;
          }
        }
      }
      log.push(`Seeded ${seededReels} paper reels from factory data into cloud PostgreSQL.`);
    } else {
      log.push(`Reel table already contains ${reelCount} reels. Skipped reel re-seeding.`);
    }

    return NextResponse.json({
      success: true,
      message: 'Cloud Database initialized and seeded successfully!',
      log,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        log,
      },
      { status: 500 }
    );
  }
}
