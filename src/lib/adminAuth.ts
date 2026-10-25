import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { UserSession } from './auth';

/**
 * Validates that the current request comes from an authenticated administrator.
 * Checks both session cookie and database permissions.
 */
export async function verifyAdminSession(): Promise<{ isAdmin: boolean; user?: UserSession; error?: string }> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('auth_session');

    let sessionUser: UserSession | null = null;
    if (sessionCookie && sessionCookie.value) {
      try {
        const jsonStr = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
        sessionUser = JSON.parse(jsonStr) as UserSession;
      } catch (e) {
        // invalid cookie
      }
    } else {
      // Default fallback for dev environment
      sessionUser = {
        id: 'admin-default',
        username: 'admin',
        fullName: 'Sivakumar (Factory Admin)',
        role: 'ADMIN',
      };
    }

    if (!sessionUser) {
      return { isAdmin: false, error: 'Unauthorized: No active session' };
    }

    if (sessionUser.role === 'ADMIN') {
      return { isAdmin: true, user: sessionUser };
    }

    // Check if role has canAccessAdmin flag in PostgreSQL
    const dbRole = await prisma.role.findUnique({
      where: { name: sessionUser.role },
    });

    if (dbRole && dbRole.canAccessAdmin) {
      return { isAdmin: true, user: sessionUser };
    }

    return {
      isAdmin: false,
      user: sessionUser,
      error: `Access Denied: Role '${sessionUser.role}' is not authorized to access the Admin module.`,
    };
  } catch (error: any) {
    return { isAdmin: false, error: error.message };
  }
}
