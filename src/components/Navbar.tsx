'use client';

import React, { useState } from 'react';
import { Search, Plus, QrCode, Shield, RefreshCw, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';
import { useApp } from './AppShell';

interface NavbarProps {
  currentRole: UserRole;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
}

export default function Navbar({ currentRole, onRefresh, onSearch }: NavbarProps) {
  const { userSession, logout, permissions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const roleColors: Record<UserRole, { badge: string; text: string }> = {
    ADMIN: { badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400', text: 'text-amber-400' },
    ACCOUNTANT: { badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', text: 'text-emerald-400' },
    STOREKEEPER: { badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400', text: 'text-blue-400' },
    OPERATOR: { badge: 'bg-purple-500/10 border-purple-500/30 text-purple-400', text: 'text-purple-400' },
  };

  const activeColor = roleColors[currentRole] || roleColors.ADMIN;

  return (
    <header className="h-16 bg-[#0f1422]/90 backdrop-blur-md border-b border-[#1e293b] px-6 flex items-center justify-between sticky top-0 z-20 no-print">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Reel #, Size (e.g. 90.5), Mill, GSM..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full bg-[#161f33] border border-[#23314e] focus:border-amber-500/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="p-2 rounded-xl bg-[#161f33] border border-[#23314e] text-slate-300 hover:text-amber-400 hover:border-amber-500/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {permissions.canPrintLabels && (
          <Link
            href="/labels"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#161f33] border border-[#23314e] text-xs font-medium text-slate-200 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Print QR Labels</span>
          </Link>
        )}

        {permissions.canInwardReels && (
          <Link
            href="/inward"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Inward Reel</span>
          </Link>
        )}

        {/* User Profile & Role Indicator */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#1e293b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#162035] border border-[#263756] flex items-center justify-center text-amber-400 font-bold text-xs uppercase">
              {userSession ? userSession.username.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white tracking-wide truncate max-w-[140px]">
                {userSession?.fullName || userSession?.username || 'User'}
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${activeColor.badge}`}>
                  {currentRole}
                </span>
              </div>
            </div>
          </div>

          {/* Logout / Switch Role Button */}
          <Link
            href="/login"
            title="Switch User / Sign Out"
            className="p-2 rounded-xl bg-[#162035] hover:bg-rose-500/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 border border-[#23314e] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
