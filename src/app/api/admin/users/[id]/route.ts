import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const userId = decodeURIComponent(params.id);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
      include: { role: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, roleName, isActive, newPassword } = body;

    // Safety: Cannot deactivate or demote primary admin
    if (existing.username === 'admin') {
      if (isActive === false) {
        return NextResponse.json(
          { success: false, error: 'Primary system administrator cannot be deactivated.' },
          { status: 400 }
        );
      }
      if (roleName && roleName !== 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Primary system administrator must retain the ADMIN role.' },
          { status: 400 }
        );
      }
    }

    if (roleName) {
      const roleExists = await prisma.role.findUnique({
        where: { name: roleName },
      });
      if (!roleExists) {
        return NextResponse.json(
          { success: false, error: `Role '${roleName}' does not exist.` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (roleName !== undefined) updateData.roleName = roleName;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (newPassword && newPassword.trim().length > 0) {
      updateData.passwordHash = hashPassword(newPassword.trim());
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
      include: { role: true },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityName: 'USER_ACCOUNT',
        entityId: existing.username,
        details: `Admin ${auth.user?.username || 'admin'} updated user account '${existing.username}' (Role: ${updated.roleName}, Active: ${updated.isActive})`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        roleName: updated.roleName,
        roleDisplayName: updated.role.displayName,
        isActive: updated.isActive,
        updatedAt: updated.updatedAt,
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

    const userId = decodeURIComponent(params.id);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ id: userId }, { username: userId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (existing.username === 'admin') {
      return NextResponse.json(
        { success: false, error: 'The primary system administrator cannot be deleted.' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: existing.id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityName: 'USER_ACCOUNT',
        entityId: existing.username,
        details: `Admin ${auth.user?.username || 'admin'} deleted user account '${existing.username}' (${existing.fullName})`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: `User '${existing.username}' deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
