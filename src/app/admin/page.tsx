'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppShell';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  Check,
  X,
  Eye,
  EyeOff,
  UserCheck,
  History,
} from 'lucide-react';

interface RoleData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  canViewDashboard: boolean;
  canViewRegister: boolean;
  canViewPrices: boolean;
  canInwardReels: boolean;
  canIssueReels: boolean;
  canViewSheets: boolean;
  canPrintLabels: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canDeleteReels: boolean;
  canAccessAdmin: boolean;
  userCount: number;
}

interface UserData {
  id: string;
  username: string;
  fullName: string;
  roleName: string;
  roleDisplayName: string;
  canAccessAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
  user: string;
}

const PERMISSION_COLUMNS = [
  { key: 'canViewDashboard', label: 'Dashboard', desc: 'Overview metrics & statistics' },
  { key: 'canViewRegister', label: 'Stock Register', desc: 'Browse inventory of rolls' },
  { key: 'canViewPrices', label: 'View Prices (₹)', desc: 'Financial rates & purchase costs' },
  { key: 'canInwardReels', label: 'Inward Reels', desc: 'Receive rolls from mills into stock' },
  { key: 'canIssueReels', label: 'Issue / Consume', desc: 'Deduct roll weight for production' },
  { key: 'canViewSheets', label: 'Cut Sheets', desc: 'Manage cut sheet reams' },
  { key: 'canPrintLabels', label: 'QR Labels', desc: 'Print barcode/QR roll stickers' },
  { key: 'canViewReports', label: 'Valuation & Reports', desc: 'Financial closing audit statements' },
  { key: 'canManageSettings', label: 'System Settings', desc: 'Database backups & masters' },
  { key: 'canDeleteReels', label: 'Delete Reels', desc: 'Remove entries from database' },
  { key: 'canAccessAdmin', label: 'Admin Portal', desc: 'Manage roles and permissions' },
] as const;

export default function AdminPage() {
  const { currentRole, permissions: currentPermissions, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'audit'>('roles');
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Role Modal State
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplay, setNewRoleDisplay] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<Record<string, boolean>>({
    canViewDashboard: true,
    canViewRegister: true,
    canViewPrices: false,
    canInwardReels: false,
    canIssueReels: false,
    canViewSheets: true,
    canPrintLabels: false,
    canViewReports: false,
    canManageSettings: false,
    canDeleteReels: false,
    canAccessAdmin: false,
  });

  // New User Modal State
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('OPERATOR');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRoleName, setEditRoleName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, usersRes, auditRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/users'),
        fetch('/api/admin/audit'),
      ]);

      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();
      const auditData = await auditRes.json();

      if (rolesData.success) setRoles(rolesData.roles);
      if (usersData.success) setUsers(usersData.users);
      if (auditData.success) setAuditLogs(auditData.logs);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to load admin data: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Toggle permission for a role in state
  const handleTogglePerm = (roleId: string, permKey: string) => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === roleId) {
          // Prevent disabling canAccessAdmin on ADMIN role
          if (role.name === 'ADMIN' && permKey === 'canAccessAdmin') {
            showNotification('error', 'The ADMIN role must retain Admin Portal access.');
            return role;
          }
          return {
            ...role,
            [permKey]: !role[permKey as keyof RoleData],
          };
        }
        return role;
      })
    );
  };

  // Save role permissions to PostgreSQL
  const handleSaveRole = async (role: RoleData) => {
    setSavingRoleId(role.id);
    try {
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(role.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Permissions for '${role.displayName}' updated successfully!`);
        triggerRefresh();
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to update role');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSavingRoleId(null);
    }
  };

  // Delete a role
  const handleDeleteRole = async (role: RoleData) => {
    if (!confirm(`Are you sure you want to delete role '${role.displayName}'? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(role.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || `Role '${role.displayName}' deleted.`);
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete role');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Create new role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleDisplay.trim()) {
      showNotification('error', 'Role code and display title are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          displayName: newRoleDisplay,
          description: newRoleDesc,
          ...newRolePerms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `Custom role '${newRoleDisplay}' created in PostgreSQL!`);
        setShowNewRoleModal(false);
        setNewRoleName('');
        setNewRoleDisplay('');
        setNewRoleDesc('');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to create role');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      showNotification('error', 'Username, full name, and password are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          fullName: newFullName,
          password: newPassword,
          roleName: newUserRole,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `User '${newUsername}' successfully created and assigned role ${newUserRole}!`);
        setShowNewUserModal(false);
        setNewUsername('');
        setNewFullName('');
        setNewPassword('');
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to create user');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Save edited user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(editingUser.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          roleName: editRoleName,
          isActive: editIsActive,
          ...(editPassword.trim() ? { newPassword: editPassword.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', `User '${editingUser.username}' updated successfully!`);
        setEditingUser(null);
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to update user');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete user
  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Are you sure you want to permanently delete user account '${user.username}' (${user.fullName})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || `User '${user.username}' deleted.`);
        fetchData();
      } else {
        showNotification('error', data.error || 'Failed to delete user');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // If current role is not ADMIN and doesn't have canAccessAdmin, block access
  const isAuthorized = currentRole === 'ADMIN' || currentPermissions.canAccessAdmin;

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto mt-16 bg-[#111726] border border-rose-500/30 rounded-3xl p-10 text-center shadow-2xl space-y-5">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Admin Portal Restricted
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
          The Admin Module is strictly isolated for system administrators. Your current active role is{' '}
          <span className="font-bold text-amber-400">'{currentRole}'</span>, which does not hold administrative permissions.
        </p>
        <div className="p-4 rounded-xl bg-[#162035] border border-[#23314e] text-xs text-slate-400 text-left space-y-1">
          <p className="font-semibold text-slate-200">Security Rule:</p>
          <p>• Only users with the <span className="text-amber-300 font-mono">ADMIN</span> role can create custom roles, toggle permissions, or manage factory user logins.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-top-4 ${
            message.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-900/30'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-900/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#141c30] via-[#162444] to-[#12192b] border border-[#233252] p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/25">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Admin & RBAC Portal</h1>
                <span className="text-[11px] font-semibold bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Admin Only
                </span>
                <span className="text-[11px] font-mono bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  PostgreSQL 18
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Maintain roles, custom permissions matrix, factory user accounts, and security audit logs in PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1d2942] hover:bg-[#253556] text-xs font-semibold text-slate-300 border border-[#2c3d61] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            {activeTab === 'roles' && (
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Role</span>
              </button>
            )}
            {activeTab === 'users' && (
              <button
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-[#233252] pt-4">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'roles'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b263b]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Roles & Permission Matrix</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full ml-1 font-mono">
              {roles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b263b]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Factory User Accounts</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full ml-1 font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1b263b]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Security Audit Log</span>
            <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-full ml-1 font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: ROLES & PERMISSION MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#12192b] border border-[#22304d] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Configured Roles</p>
                <p className="text-2xl font-bold text-white mt-1">{roles.length}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Stored dynamically in PostgreSQL</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#12192b] border border-[#22304d] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Core Protected Roles</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {roles.filter((r) => r.isSystem).length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">ADMIN, ACCOUNTANT, STORE, OPERATOR</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#12192b] border border-[#22304d] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Custom Factory Roles</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {roles.filter((r) => !r.isSystem).length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Created by Administrator</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Interactive Permissions Matrix */}
          <div className="bg-[#111726] border border-[#202d48] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#202d48] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131b2e]/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Interactive Permission Matrix</span>
                  <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-normal">
                    Toggle switches to adjust role clearances
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click checkmarks to grant/revoke actions. Click <span className="text-amber-400 font-semibold">Save</span> to apply live to the database.
                </p>
              </div>
              <button
                onClick={() => setShowNewRoleModal(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1c273e] hover:bg-[#253453] text-xs font-semibold text-amber-300 border border-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Role</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e1422] border-b border-[#202d48] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 min-w-[200px]">Role Profile</th>
                    {PERMISSION_COLUMNS.map((col) => (
                      <th key={col.key} className="py-3 px-3 text-center whitespace-nowrap" title={col.desc}>
                        {col.label}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b253b]">
                  {roles.map((role) => {
                    const isSaving = savingRoleId === role.id;

                    return (
                      <tr key={role.id} className="hover:bg-[#151e33]/70 transition-colors">
                        {/* Role Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                role.name === 'ADMIN'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : role.name === 'ACCOUNTANT'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : role.name === 'STOREKEEPER'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}
                            >
                              {role.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100">{role.displayName}</span>
                                {role.isSystem && (
                                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">
                                    SYSTEM
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{role.name}</p>
                              {role.description && (
                                <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-[180px]">
                                  {role.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Permission Checkbox Columns */}
                        {PERMISSION_COLUMNS.map((col) => {
                          const isEnabled = Boolean(role[col.key as keyof RoleData]);
                          const isLocked = role.name === 'ADMIN' && col.key === 'canAccessAdmin';

                          return (
                            <td key={col.key} className="py-3 px-3 text-center">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => handleTogglePerm(role.id, col.key)}
                                title={
                                  isLocked
                                    ? 'Admin cannot be locked out of Admin Portal'
                                    : `${isEnabled ? 'Revoke' : 'Grant'} ${col.label}`
                                }
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                  isEnabled
                                    ? col.key === 'canViewPrices'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                      : col.key === 'canAccessAdmin'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30'
                                    : 'bg-[#182236] text-slate-600 border border-[#24334f] hover:text-slate-400 hover:bg-[#1f2c45]'
                                } ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                              >
                                {isEnabled ? <Check className="w-4 h-4 stroke-[2.5]" /> : <X className="w-3.5 h-3.5 opacity-40" />}
                              </button>
                            </td>
                          );
                        })}

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveRole(role)}
                              disabled={isSaving}
                              title="Save permissions to PostgreSQL"
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold transition-all"
                            >
                              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                              <span>Save</span>
                            </button>

                            {!role.isSystem && (
                              <button
                                onClick={() => handleDeleteRole(role)}
                                title="Delete custom role"
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Price Masking Alert Notice */}
            <div className="p-4 bg-[#141b2c] border-t border-[#202d48] flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-slate-200">Price Masking Security:</strong> When{' '}
                  <span className="text-emerald-400 font-mono">View Prices (₹)</span> is disabled for a role, all rate columns (₹/KG, roll valuation, total asset value) are completely masked on the dashboard and stock register.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-[#111726] border border-[#202d48] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#202d48] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#131b2e]/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Factory Personnel Accounts</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage factory user logins, assign dynamic roles, and configure access statuses.
                </p>
              </div>

              <button
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Factory User</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e1422] border-b border-[#202d48] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b253b]">
                  {users.map((u) => {
                    const isSuperAdmin = u.username === 'admin';

                    return (
                      <tr key={u.id} className="hover:bg-[#151e33]/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-xs">
                              {u.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{u.fullName}</p>
                              <p className="text-[10px] text-slate-400">ID: {u.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono bg-[#162035] px-2.5 py-1 rounded-lg border border-[#23314e] text-slate-300">
                            {u.username}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                                u.roleName === 'ADMIN'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : u.roleName === 'ACCOUNTANT'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : u.roleName === 'STOREKEEPER'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              }`}
                            >
                              {u.roleDisplayName || u.roleName}
                            </span>
                            {u.canAccessAdmin && (
                              <span title="Has Admin Portal Clearance" className="text-amber-400">
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              u.isActive
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`}
                            ></span>
                            <span>{u.isActive ? 'Active' : 'Disabled'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditFullName(u.fullName);
                                setEditRoleName(u.roleName);
                                setEditIsActive(u.isActive);
                                setEditPassword('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#182338] hover:bg-[#202e48] text-slate-300 border border-[#263756] font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            {!isSuperAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete user account"
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-[#111726] border border-[#202d48] rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#202d48] bg-[#131b2e]/60 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <span>Security & Role Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Immutable ledger recording all role modifications, permission adjustments, user sessions, and credentials updates.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs text-slate-300 bg-[#1a253c] hover:bg-[#22304d] px-3 py-1.5 rounded-xl border border-[#29395b]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Log</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-[#0e1422] border-b border-[#202d48] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Initiator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b253b]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No security audit records logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#141d30]/60 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.action === 'UPDATE'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : log.action === 'DELETE'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                        {log.entityName}
                      </td>

                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {log.details}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-amber-400 text-[11px]">
                        @{log.user}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CUSTOM ROLE */}
      {showNewRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-[#12192b] border border-[#253556] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#202d48] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Custom Role</h3>
                  <p className="text-xs text-slate-400">
                    Define a tailored factory role and select exact permission clearances.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewRoleModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Role Code (Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. QUALITY_SUPERVISOR"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-amber-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Unique uppercase code without spaces</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Display Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quality & Floor Inspector"
                    value={newRoleDisplay}
                    onChange={(e) => setNewRoleDisplay(e.target.value)}
                    className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Role Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Responsible for sampling burst factor, roll quality approval, and corrugation output."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Permission Matrix for New Role */}
              <div className="border border-[#202d48] rounded-2xl p-4 bg-[#0e1422]/60 space-y-3">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Grant Permissions for this Role:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {PERMISSION_COLUMNS.map((col) => {
                    const isChecked = Boolean(newRolePerms[col.key]);

                    return (
                      <label
                        key={col.key}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/30 text-white'
                            : 'bg-[#141b2c] border-[#1f2c45] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold">{col.label}</p>
                          <p className="text-[10px] text-slate-500">{col.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setNewRolePerms((prev) => ({
                              ...prev,
                              [col.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded text-amber-500 bg-[#1e2a44] border-slate-600 focus:ring-0 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202d48]">
                <button
                  type="button"
                  onClick={() => setShowNewRoleModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162035] text-slate-300 hover:bg-[#1e2b46] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-lg shadow-amber-500/25"
                >
                  Save Role to PostgreSQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW USER */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-[#12192b] border border-[#253556] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#202d48] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Add Factory User</h3>
                  <p className="text-xs text-slate-400">
                    Create a new system user login and assign an active role.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ramesh"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().trim())}
                    className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="e.g. ramesh123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Assign System Role *
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:border-emerald-500 outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.displayName} ({r.name})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  The user will automatically inherit all permissions granted to this role.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202d48]">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#162035] text-slate-300 hover:bg-[#1e2b46] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/25"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-[#12192b] border border-[#253556] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#202d48] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit User: {editingUser.username}</h3>
                  <p className="text-xs text-slate-400">Modify user full name, role assignment, or reset password.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a253c]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Assigned Role
                </label>
                <select
                  value={editRoleName}
                  disabled={editingUser.username === 'admin'}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  className={`w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-bold focus:border-blue-500 outline-none ${
                    editingUser.username === 'admin' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.displayName} ({r.name})
                    </option>
                  ))}
                </select>
                {editingUser.username === 'admin' && (
                  <p className="text-[10px] text-amber-400 mt-1">The primary system admin role cannot be changed.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Reset Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-[#162035] border border-[#243452] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-[#162035] border border-[#243452] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    disabled={editingUser.username === 'admin'}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-500 bg-[#1e2a44] border-slate-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Active Account</p>
                    <p className="text-[10px] text-slate-400">
                      When unchecked, the user will be blocked from logging into the software.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#202d48]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#162035] text-slate-300 hover:bg-[#1e2b46] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
