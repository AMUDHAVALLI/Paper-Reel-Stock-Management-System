import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminSession } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await verifyAdminSession();
    if (!auth.isAdmin) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        role: {
          select: {
            name: true,
            displayName: true,
            canAccessAdmin: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        roleName: u.roleName,
        roleDisplayName: u.role.displayName,
        canAccessAdmin: u.role.canAccessAdmin,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
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
    const { username, password, fullName, roleName, isActive = true } = body;

    if (!username || !password || !fullName || !roleName) {
      return NextResponse.json(
        { success: false, error: 'Username, password, full name, and role are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Username '${cleanUsername}' already exists.` },
        { status: 400 }
      );
    }

    // Verify role exists
    const roleExists = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!roleExists) {
      return NextResponse.json(
        { success: false, error: `Role '${roleName}' does not exist.` },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        fullName: fullName.trim(),
        passwordHash,
        roleName,
        isActive: Boolean(isActive),
      },
      include: {
        role: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityName: 'USER_ACCOUNT',
        entityId: cleanUsername,
        details: `Admin ${auth.user?.username || 'admin'} created new user account '${cleanUsername}' (${fullName}) with role ${roleName}`,
        user: auth.user?.username || 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        roleName: newUser.roleName,
        roleDisplayName: newUser.role.displayName,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
