import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ROLE_PERMISSIONS, UserSession } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth_session');

    let user: UserSession = {
      id: 'admin-default',
      username: 'admin',
      fullName: 'Sivakumar (Factory Admin)',
      role: 'ADMIN',
    };

    if (sessionCookie && sessionCookie.value) {
      try {
        const jsonStr = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
        user = JSON.parse(jsonStr) as UserSession;
      } catch (e) {
        // use default user
      }
    }

    // Fetch dynamic permissions from PostgreSQL Role table
    let permissions = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS.ADMIN;
    try {
      const dbRole = await prisma.role.findUnique({
        where: { name: user.role },
      });
      if (dbRole) {
        permissions = {
          canViewDashboard: dbRole.canViewDashboard,
          canViewRegister: dbRole.canViewRegister,
          canInwardReels: dbRole.canInwardReels,
          canIssueReels: dbRole.canIssueReels,
          canViewSheets: dbRole.canViewSheets,
          canPrintLabels: dbRole.canPrintLabels,
          canViewPrices: dbRole.canViewPrices,
          canViewReports: dbRole.canViewReports,
          canManageSettings: dbRole.canManageSettings,
          canDeleteReels: dbRole.canDeleteReels,
          canAccessAdmin: dbRole.canAccessAdmin,
          roleBadgeText: dbRole.displayName,
          roleDescription: dbRole.description || '',
        };
      }
    } catch (dbErr) {
      // Fallback to static permissions if DB query fails
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
      permissions,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}
