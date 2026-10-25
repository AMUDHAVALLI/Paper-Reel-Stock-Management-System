import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const roleKey = decodeURIComponent(params.id);
    const existing = await prisma.role.findFirst({
      where: {
        OR: [{ id: roleKey }, { name: roleKey }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      displayName,
      description,
      canViewDashboard,
      canViewRegister,
      canViewPrices,
      canInwardReels,
      canIssueReels,
      canViewSheets,
      canPrintLabels,
      canViewReports,
      canManageSettings,
      canDeleteReels,
      canAccessAdmin,
    } = body;

    // Safety guard: ADMIN must always have admin access
    let safeCanAccessAdmin = Boolean(canAccessAdmin);
    if (existing.name === 'ADMIN') {
      safeCanAccessAdmin = true;
    }

    const updated = await prisma.role.update({
      where: { id: existing.id },
      data: {
        ...(displayName !== undefined ? { displayName: displayName.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(canViewDashboard !== undefined ? { canViewDashboard: Boolean(canViewDashboard) } : {}),
        ...(canViewRegister !== undefined ? { canViewRegister: Boolean(canViewRegister) } : {}),
        ...(canViewPrices !== undefined ? { canViewPrices: Boolean(canViewPrices) } : {}),
        ...(canInwardReels !== undefined ? { canInwardReels: Boolean(canInwardReels) } : {}),
        ...(canIssueReels !== undefined ? { canIssueReels: Boolean(canIssueReels) } : {}),
        ...(canViewSheets !== undefined ? { canViewSheets: Boolean(canViewSheets) } : {}),
        ...(canPrintLabels !== undefined ? { canPrintLabels: Boolean(canPrintLabels) } : {}),
        ...(canViewReports !== undefined ? { canViewReports: Boolean(canViewReports) } : {}),
        ...(canManageSettings !== undefined ? { canManageSettings: Boolean(canManageSettings) } : {}),
        ...(canDeleteReels !== undefined ? { canDeleteReels: Boolean(canDeleteReels) } : {}),
        ...(canAccessAdmin !== undefined ? { canAccessAdmin: safeCanAccessAdmin } : {}),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityName: 'ROLE_CONFIG',
        entityId: existing.name,
        details: `Admin ${auth.user?.username || 'admin'} updated permissions for role '${existing.displayName}' (${existing.name})`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        ...updated,
        userCount: updated._count.users,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const roleKey = decodeURIComponent(params.id);
    const existing = await prisma.role.findFirst({
      where: {
        OR: [{ id: roleKey }, { name: roleKey }],
      },
      include: {
        users: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json(
        { success: false, error: `System role '${existing.name}' is a protected core role and cannot be deleted.` },
        { status: 400 }
      );
    }

    if (existing.users.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role '${existing.name}' because ${existing.users.length} active user(s) are assigned to it. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: existing.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityName: 'ROLE_CONFIG',
        entityId: existing.name,
        details: `Admin ${auth.user?.username || 'admin'} deleted role '${existing.displayName}' (${existing.name})`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role ${existing.name} deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
