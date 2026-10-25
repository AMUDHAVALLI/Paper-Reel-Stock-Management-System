import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'sqlite') {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ success: false, error: 'Database file not found' }, { status: 404 });
      }
      const fileBuffer = fs.readFileSync(dbPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/x-sqlite3',
          'Content-Disposition': `attachment; filename="paper_reel_stock_${new Date().toISOString().split('T')[0]}.db"`,
        },
      });
    }

    // Default JSON database dump
    const [reels, consumptionLogs, auditLogs, setting] = await Promise.all([
      prisma.reel.findMany(),
      prisma.consumptionLog.findMany(),
      prisma.auditLog.findMany(),
      prisma.setting.findFirst(),
    ]);

    const backupPayload = {
      exportDate: new Date().toISOString(),
      databaseEngine: 'SQLite / Prisma',
      setting,
      reels,
      consumptionLogs,
      auditLogs,
    };

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="paper_reel_sqlite_dump_${new Date().toISOString().split('T')[0]}.json"`,
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
      const backupDbPath = path.join(backupDir, `dev_snapshot_${timestamp}.db`);
      const srcDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

      fs.copyFileSync(srcDbPath, backupDbPath);

      await prisma.auditLog.create({
        data: {
          action: 'RESTORE',
          entityName: 'SQLITE_DATABASE',
          entityId: `dev_snapshot_${timestamp}.db`,
          details: `Created snapshot copy of SQLite database: dev_snapshot_${timestamp}.db`,
          user: body.user || 'Admin',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'SQLite database snapshot saved successfully to data/backups/',
        path: backupDbPath,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
