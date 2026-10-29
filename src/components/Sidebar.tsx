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
      name: 'Admin Portal',
      href: '/admin',
      icon: ShieldCheck,
      allowed: permissions.canAccessAdmin || currentRole === 'ADMIN',
      badge: 'Admin',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 no-print select-none z-30 shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d97706] flex items-center justify-center shadow-md shadow-amber-500/25 text-white font-extrabold text-xl font-heading">
            ON
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xs tracking-wide text-slate-900 leading-tight uppercase">
              OM NAMASIVAYAM
            </h1>
            <p className="text-[10px] text-amber-600 font-bold tracking-wider uppercase mt-0.5">
              Corrugated Packaging
            </p>
          </div>
        </div>

        {/* Plant Status Tag */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-700 flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#d97706' }}></span>
            <span>70–90 T/M Plant</span>
          </span>
          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 font-bold font-mono">
            Puducherry
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'btn-theme-primary text-white font-bold shadow-md shadow-amber-500/20'
                    : isAllowed
                    ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAllowed ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={!isAllowed ? 'line-through text-xs' : ''}>{item.name}</span>
                </div>

                {!isAllowed ? (
                  <span title="Restricted for current role" className="text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                ) : item.badge !== null ? (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-white/25 text-white font-bold'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
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

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
        <p className="text-[10px] font-bold text-amber-700 tracking-wider uppercase font-heading">
          OM NAMASIVAYAM PACKAGING
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
          Phone: +91 86080 12974
        </p>
      </div>
    </aside>
  );
}
