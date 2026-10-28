'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  PackagePlus,
  Scissors,
  QrCode,
  BarChart3,
  Settings,
  ShieldCheck,
  Box,
  Lock,
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { useApp } from './AppShell';

interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeCount?: number;
}

export default function Sidebar({ currentRole, activeCount }: SidebarProps) {
  const pathname = usePathname();
  const { permissions } = useApp();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      allowed: permissions.canViewDashboard,
      badge: null,
    },
    {
      name: 'Stock Register',
      href: '/register',
      icon: Layers,
      allowed: permissions.canViewRegister,
      badge: activeCount !== undefined ? activeCount : null,
    },
    {
      name: 'Reel Inward (Stock In)',
      href: '/inward',
      icon: PackagePlus,
      allowed: permissions.canInwardReels,
      badge: '+Add',
    },
    {
      name: 'Reel Issue / Consume',
      href: '/consumption',
      icon: Scissors,
      allowed: permissions.canIssueReels,
      badge: null,
    },
    {
      name: 'Cut Sheet Stock',
      href: '/sheets',
      icon: Box,
      allowed: permissions.canViewSheets,
      badge: null,
    },
    {
      name: 'Barcode & QR Labels',
      href: '/labels',
      icon: QrCode,
      allowed: permissions.canPrintLabels,
      badge: null,
    },
    {
      name: 'Valuation & Reports',
      href: '/reports',
      icon: BarChart3,
      allowed: permissions.canViewReports,
      badge: null,
    },
    {
      name: 'Settings & Backups',
      href: '/settings',
      icon: Settings,
      allowed: permissions.canManageSettings,
      badge: null,
    },
    {
      name: 'Admin Portal',
      href: '/admin',
      icon: ShieldCheck,
      allowed: permissions.canAccessAdmin || currentRole === 'ADMIN',
      badge: 'Admin',
    },
  ];

  return (
    <aside className="w-64 bg-[#0d121f] border-r border-[#1e293b] flex flex-col justify-between h-screen sticky top-0 no-print select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-xl">
            ON
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
              OM NAMASIVAYAM
            </h1>
            <p className="text-[11px] text-amber-400/80 font-medium tracking-wide uppercase">
              Packaging • Reels ERP
            </p>
          </div>
        </div>

        {/* Financial Year Tag */}
        <div className="px-5 py-2 bg-[#12192b]/60 border-b border-[#1e293b] flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FY 2026-2027
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
            PostgreSQL 18
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAllowed = item.allowed;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 font-semibold'
                    : isAllowed
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-[#162035]'
                    : 'text-slate-600 hover:text-slate-400 hover:bg-[#121828] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAllowed ? 'text-slate-400' : 'text-slate-600'}`} />
                  <span className={!isAllowed ? 'line-through text-xs' : ''}>{item.name}</span>
                </div>

                {!isAllowed ? (
                  <span title="Restricted for current role" className="text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                ) : item.badge !== null ? (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#1e293b] text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Branding (Active role switcher hidden) */}
      <div className="p-4 border-t border-[#1e293b] bg-[#0b0e17]/70 text-center">
        <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
          OM NAMASIVAYAM PACKAGING
        </p>
        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
          Enterprise ERP System
        </p>
      </div>
    </aside>
  );
}
