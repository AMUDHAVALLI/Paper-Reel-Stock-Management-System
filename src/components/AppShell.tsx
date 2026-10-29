'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { UserRole } from '@/lib/types';
import { UserSession, RolePermissions, ROLE_PERMISSIONS } from '@/lib/auth';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';

interface AppContextType {
  userSession: UserSession | null;
  setUserSession: (user: UserSession | null) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  permissions: RolePermissions;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  activeCount: number;
  setActiveCount: (count: number) => void;
  logout: () => Promise<void>;
}

const defaultPermissions = ROLE_PERMISSIONS.ADMIN;

const AppContext = createContext<AppContextType>({
  userSession: null,
  setUserSession: () => {},
  currentRole: 'ADMIN',
  setCurrentRole: () => {},
  permissions: defaultPermissions,
  globalSearch: '',
  setGlobalSearch: () => {},
  refreshKey: 0,
  triggerRefresh: () => {},
  activeCount: 0,
  setActiveCount: () => {},
  logout: async () => {},
});

export const useApp = () => useContext(AppContext);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [userSession, setUserSession] = useState<UserSession | null>({
    id: 'admin-default',
    username: 'admin',
    fullName: 'Sivakumar (Factory Admin)',
    role: 'ADMIN',
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN');
  const [dynamicPermissions, setDynamicPermissions] = useState<Record<string, RolePermissions>>({});
  const [globalSearch, setGlobalSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Sync role and load dynamic permissions from PostgreSQL
  const syncPermissions = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.success && meData.user) {
        setUserSession(meData.user);
        setCurrentRole(meData.user.role as UserRole);
        if (meData.permissions) {
          setDynamicPermissions((prev) => ({
            ...prev,
            [meData.user.role]: meData.permissions,
          }));
        }
      }

      // Also pre-fetch all roles permissions from DB
      const rolesRes = await fetch('/api/admin/roles');
      const rolesData = await rolesRes.json();
      if (rolesData.success && rolesData.roles) {
        const map: Record<string, RolePermissions> = {};
        rolesData.roles.forEach((r: any) => {
          map[r.name] = {
            canViewDashboard: r.canViewDashboard,
            canViewRegister: r.canViewRegister,
            canInwardReels: r.canInwardReels,
            canIssueReels: r.canIssueReels,
            canViewSheets: r.canViewSheets,
            canPrintLabels: r.canPrintLabels,
            canViewPrices: r.canViewPrices,
            canViewReports: r.canViewReports,
            canManageSettings: r.canManageSettings,
            canDeleteReels: r.canDeleteReels,
            canAccessAdmin: r.canAccessAdmin,
            roleBadgeText: r.displayName,
            roleDescription: r.description || '',
          };
        });
        setDynamicPermissions((prev) => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error('Failed to load session/roles:', e);
    }
  };

  useEffect(() => {
    syncPermissions();
  }, [refreshKey]);

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (userSession) {
      setUserSession({ ...userSession, role: newRole });
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUserSession(null);
    router.push('/login');
  };

  const triggerRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const permissions =
    dynamicPermissions[currentRole] ||
    ROLE_PERMISSIONS[currentRole] ||
    ROLE_PERMISSIONS.ADMIN;

  // If on Login page, render directly
  if (pathname === '/login') {
    return (
      <AppContext.Provider
        value={{
          userSession,
          setUserSession,
          currentRole,
          setCurrentRole: handleRoleChange,
          permissions,
          globalSearch,
          setGlobalSearch,
          refreshKey,
          triggerRefresh,
          activeCount,
          setActiveCount,
          logout,
        }}
      >
        {children}
      </AppContext.Provider>
    );
  }

  // Page-level Permission Gate Check
  let accessDeniedMessage: string | null = null;
  if (pathname === '/admin' && !permissions.canAccessAdmin && currentRole !== 'ADMIN') {
    accessDeniedMessage = `The role '${currentRole}' is strictly restricted from accessing the Admin Module. Only factory administrators can create roles or modify permissions.`;
  } else if (pathname === '/inward' && !permissions.canInwardReels) {
    accessDeniedMessage = `The role '${currentRole}' does not have permission to inward new reels. Only Admin and Storekeeper can receive paper rolls from mills.`;
  } else if (pathname === '/reports' && !permissions.canViewReports) {
    accessDeniedMessage = `The role '${currentRole}' does not have permission to view closing stock valuations and financial statements. Only Admin and Accountant have financial reporting clearance.`;
  }

  return (
    <AppContext.Provider
      value={{
        userSession,
        setUserSession,
        currentRole,
        setCurrentRole: handleRoleChange,
        permissions,
        globalSearch,
        setGlobalSearch,
        refreshKey,
        triggerRefresh,
        activeCount,
        setActiveCount,
        logout,
      }}
    >
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <Sidebar
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          activeCount={activeCount}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            currentRole={currentRole}
            onRefresh={triggerRefresh}
            onSearch={setGlobalSearch}
          />
          <main className="flex-1 p-6 overflow-y-auto">
            {accessDeniedMessage ? (
              <div className="max-w-2xl mx-auto mt-12 bg-white border border-rose-300 rounded-3xl p-8 text-center shadow-lg space-y-4 theme-card">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-heading font-bold text-slate-900 tracking-tight">
                  Access Restricted for Role: {currentRole}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-lg mx-auto">
                  {accessDeniedMessage}
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="btn-theme-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold text-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                  </Link>
                  <Link
                    href="/login"
                    className="btn-theme-primary px-5 py-2.5 rounded-xl text-white text-xs font-heading font-bold shadow-md shadow-amber-500/20"
                  >
                    Switch Account / Role
                  </Link>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
