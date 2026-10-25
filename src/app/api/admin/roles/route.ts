import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const roles = await prisma.role.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      roles: roles.map((r) => ({
        ...r,
        userCount: r._count.users,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      displayName,
      description,
      canViewDashboard = true,
      canViewRegister = true,
      canViewPrices = false,
      canInwardReels = false,
      canIssueReels = false,
      canViewSheets = true,
      canPrintLabels = false,
      canViewReports = false,
      canManageSettings = false,
      canDeleteReels = false,
      canAccessAdmin = false,
    } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { success: false, error: 'Role identifier (name) and display title are required' },
        { status: 400 }
      );
    }

    const sanitizedCode = name.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    // Check if role code already exists
    const existing = await prisma.role.findUnique({
      where: { name: sanitizedCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Role code '${sanitizedCode}' already exists.` },
        { status: 400 }
      );
    }

    const newRole = await prisma.role.create({
      data: {
        name: sanitizedCode,
        displayName: displayName.trim(),
        description: description?.trim() || null,
        isSystem: false,
        canViewDashboard: Boolean(canViewDashboard),
        canViewRegister: Boolean(canViewRegister),
        canViewPrices: Boolean(canViewPrices),
        canInwardReels: Boolean(canInwardReels),
        canIssueReels: Boolean(canIssueReels),
        canViewSheets: Boolean(canViewSheets),
        canPrintLabels: Boolean(canPrintLabels),
        canViewReports: Boolean(canViewReports),
        canManageSettings: Boolean(canManageSettings),
        canDeleteReels: Boolean(canDeleteReels),
        canAccessAdmin: Boolean(canAccessAdmin),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityName: 'ROLE_CONFIG',
        entityId: sanitizedCode,
        details: `Admin ${auth.user?.username || 'admin'} created new role '${displayName}' (${sanitizedCode})`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        ...newRole,
        userCount: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
