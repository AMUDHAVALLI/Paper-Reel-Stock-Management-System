import { PrismaClient } from '@prisma/client';
import path from 'path';
import { parseReelStockExcel } from '../src/lib/excel-parser';

const prisma = new PrismaClient();

async function main() {
  const excelPath = path.join(process.cwd(), 'REELS STOCK 26-27 NEW.xlsx');
  console.log(`Loading Excel from: ${excelPath}`);

  const parsed = parseReelStockExcel(excelPath);
  console.log(`Found ${parsed.reels.length} reels in Excel sheet.`);

  // Upsert company setting
  await prisma.setting.upsert({
    where: { id: 'default' },
    update: {
      companyName: parsed.companyName,
      financialYear: parsed.financialYear,
    },
    create: {
      id: 'default',
      companyName: parsed.companyName,
      financialYear: parsed.financialYear,
      currencySymbol: '₹',
      lowStockThresholdKg: 1000,
    },
  });

  // Seed system roles with default permissions
  const defaultRoles = [
    {
      name: 'ADMIN',
      displayName: 'Factory Administrator / Owner',
      description: 'Complete operational and financial control, pricing management, and user administration.',
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
      displayName: 'Chief Accountant & Auditor',
      description: 'Financial asset audit, closing stock valuations, and raw material purchase reports.',
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
      displayName: 'Raw Material Store Incharge',
      description: 'Receive paper rolls from mills, generate adhesive barcode/QR labels, manage warehouse bays.',
      isSystem: true,
      canViewDashboard: true,
      canViewRegister: true,
      canViewPrices: false, // Masked
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
      displayName: 'Machine & Corrugator Operator',
      description: 'Record roll usage on Corrugator Line 1 & 2. Rates and financial valuations restricted.',
      isSystem: true,
      canViewDashboard: true,
      canViewRegister: true,
      canViewPrices: false, // Masked
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

  for (const r of defaultRoles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: r,
      create: r,
    });
  }
  console.log(` Seeded ${defaultRoles.length} System Roles in PostgreSQL`);

  // Seed default users linked to roles
  const bcrypt = await import('bcryptjs');
  const defaultUsers = [
    {
      username: 'admin',
      password: 'admin123',
      fullName: 'Sivakumar (Factory Admin)',
      roleName: 'ADMIN',
    },
    {
      username: 'accountant',
      password: 'account123',
      fullName: 'Ramesh (Chief Accountant)',
      roleName: 'ACCOUNTANT',
    },
    {
      username: 'store',
      password: 'store123',
      fullName: 'Murugan (Store Incharge)',
      roleName: 'STOREKEEPER',
    },
    {
      username: 'operator',
      password: 'operator123',
      fullName: 'Karthik (Corrugator Operator)',
      roleName: 'OPERATOR',
    },
  ];

  for (const u of defaultUsers) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(u.password, salt);
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        passwordHash,
        fullName: u.fullName,
        roleName: u.roleName,
      },
      create: {
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        roleName: u.roleName,
      },
    });
  }
  console.log(` Seeded 4 Users in PostgreSQL: admin, accountant, store, operator`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const r of parsed.reels) {
    const existing = await prisma.reel.findUnique({
      where: { reelNo: r.reelNo },
    });

    if (existing) {
      await prisma.reel.update({
        where: { reelNo: r.reelNo },
        data: {
          itemType: r.itemType,
          category: r.category,
          sizeDesc: r.sizeDesc,
          sizeValue: r.sizeValue,
          sizeUnit: r.sizeUnit,
          gsm: r.gsm,
          bf: r.bf,
          weight: r.weight,
          usedWeight: r.usedWeight,
          balanceWeight: r.balanceWeight,
          pricePerKg: r.pricePerKg,
          reelAmount: r.reelAmount,
          consumedAmount: r.consumedAmount,
          balanceAmount: r.balanceAmount,
          millName: r.millName,
          status: r.status,
          inwardDate: r.inwardDate,
          usedDate: r.usedDate,
          financialYear: r.financialYear,
          isSheet: r.isSheet,
        },
      });
      updatedCount++;
    } else {
      await prisma.reel.create({
        data: {
          reelNo: r.reelNo,
          itemType: r.itemType,
          category: r.category,
          sizeDesc: r.sizeDesc,
          sizeValue: r.sizeValue,
          sizeUnit: r.sizeUnit,
          gsm: r.gsm,
          bf: r.bf,
          weight: r.weight,
          usedWeight: r.usedWeight,
          balanceWeight: r.balanceWeight,
          pricePerKg: r.pricePerKg,
          reelAmount: r.reelAmount,
          consumedAmount: r.consumedAmount,
          balanceAmount: r.balanceAmount,
          millName: r.millName,
          status: r.status,
          inwardDate: r.inwardDate,
          usedDate: r.usedDate,
          financialYear: r.financialYear,
          isSheet: r.isSheet,
          bayLocation: r.category.includes('100') ? 'Bay A-1' : r.category.includes('120') ? 'Bay B-1' : 'Bay C-1',
        },
      });
      insertedCount++;
    }
  }

  // Create audit log for DB seed
  await prisma.auditLog.create({
    data: {
      action: 'IMPORT',
      entityName: 'SQLITE_DATABASE',
      entityId: 'REELS STOCK 26-27 NEW.xlsx',
      details: `Imported ${insertedCount} new reels and updated ${updatedCount} reels into SQLite database (prisma/dev.db)`,
      user: 'System Admin',
    },
  });

  const totalInDb = await prisma.reel.count();
  const balanceAgg = await prisma.reel.aggregate({
    _sum: {
      weight: true,
      usedWeight: true,
      balanceWeight: true,
      reelAmount: true,
      balanceAmount: true,
    },
  });

  console.log(`\n SQLite Database Seed Complete:`);
  console.log(` - Total Reels in SQLite DB: ${totalInDb}`);
  console.log(` - Total Weight: ${balanceAgg._sum.weight} KG`);
  console.log(` - Consumed Weight: ${balanceAgg._sum.usedWeight} KG`);
  console.log(` - Available Balance Weight: ${balanceAgg._sum.balanceWeight} KG`);
  console.log(` - Total Valuation: ₹${balanceAgg._sum.reelAmount}`);
  console.log(` - Available Stock Valuation: ₹${balanceAgg._sum.balanceAmount}`);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
