import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Comprehensive JSON PostgreSQL database export
    const [reels, consumptionLogs, auditLogs, setting, roles, users] = await Promise.all([
      prisma.reel.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.consumptionLog.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.setting.findFirst(),
      prisma.role.findMany(),
      prisma.user.findMany({ select: { id: true, username: true, fullName: true, roleName: true, isActive: true, createdAt: true } }),
    ]);

    const backupPayload = {
      exportDate: new Date().toISOString(),
      databaseEngine: 'PostgreSQL / Prisma',
      setting,
      roles,
      users,
      reels,
      consumptionLogs,
      auditLogs,
    };

    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="paper_reel_postgres_backup_${dateStr}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === 'create_snapshot') {
      const backupDir = path.join(process.cwd(), 'data', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilePath = path.join(backupDir, `postgres_snapshot_${timestamp}.json`);

      // Fetch all database records
      const [reels, consumptionLogs, auditLogs, setting, roles] = await Promise.all([
        prisma.reel.findMany(),
        prisma.consumptionLog.findMany(),
        prisma.auditLog.findMany(),
        prisma.setting.findFirst(),
        prisma.role.findMany(),
      ]);

      const snapshotData = {
        snapshotDate: new Date().toISOString(),
        databaseEngine: 'PostgreSQL',
        setting,
        roles,
        reels,
        consumptionLogs,
        auditLogs,
      };

      fs.writeFileSync(backupFilePath, JSON.stringify(snapshotData, null, 2), 'utf-8');

      await prisma.auditLog.create({
        data: {
          action: 'RESTORE',
          entityName: 'POSTGRESQL_DATABASE',
          entityId: `postgres_snapshot_${timestamp}.json`,
          details: `Created snapshot copy of PostgreSQL database: postgres_snapshot_${timestamp}.json`,
          user: body.user || 'Admin',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'PostgreSQL database snapshot saved successfully to data/backups/',
        path: backupFilePath,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
