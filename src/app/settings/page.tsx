'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCcw,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Lock,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';
import { AuditLog } from '@/lib/types';

export default function SettingsBackupsPage() {
  const { currentRole, triggerRefresh, refreshKey } = useApp();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAuditLogs(d.data.recentAudit || []);
        }
        setLoading(false);
      });
  }, [refreshKey]);

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_snapshot', user: currentRole }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg({ type: 'success', text: 'Database snapshot created successfully in data/backups/' });
        triggerRefresh();
      } else {
        setActionMsg({ type: 'error', text: data.error || 'Failed to create backup' });
      }
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.message });
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-amber-400" />
          Settings, Data Backups & Security Audit
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure factory parameters, manage automated backups, and review immutable stock transaction logs.
        </p>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Grid: Backup & System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Backup & Disaster Recovery */}
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">PostgreSQL Database Engine</h3>
                <p className="text-xs text-slate-400">Enterprise relational database on port 5432</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e] flex items-center justify-between">
                <span>Database Engine & Version</span>
                <span className="font-mono text-amber-400 text-[11px] font-bold">PostgreSQL Server 18.1</span>
              </div>
              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e] flex items-center justify-between">
                <span>Target Database</span>
                <span className="font-mono text-emerald-400 text-[11px] font-bold">paper_reel_db (localhost:5432)</span>
              </div>
              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e] flex items-center justify-between">
                <span>ORM & Transactions</span>
                <span className="font-semibold text-white">Prisma Client (ACID Transactions)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#1e293b] flex items-center gap-3">
            <button
              onClick={handleCreateSnapshot}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20"
            >
              <HardDrive className="w-4 h-4" />
              <span>Create Snapshot</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#162035] hover:bg-[#202d4b] border border-[#22314e] text-slate-200 font-semibold text-xs shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        {/* Security & Role-Based Access Control (RBAC) */}
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Security & Access Control (RBAC)</h3>
                <p className="text-xs text-slate-400">Enterprise protection against data tampering and rate leakage</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-amber-400">ADMIN / OWNER</strong>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono">Full Access</span>
                </div>
                <p className="text-slate-400 text-[11px]">Full inventory control, price editing, financial statements, and user creation.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-emerald-400">ACCOUNTANT</strong>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">Valuations</span>
                </div>
                <p className="text-slate-400 text-[11px]">Closing stock asset reports, mill purchase registers, and GST reconciliations.</p>
              </div>

              <div className="p-3 rounded-xl bg-[#162035] border border-[#22314e]">
                <div className="flex items-center justify-between mb-1">
                  <strong className="text-blue-400">STOREKEEPER / OPERATOR</strong>
                  <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-mono">Price Masked</span>
                </div>
                <p className="text-slate-400 text-[11px]">Inward rolls, print QR tags, issue paper to corrugator lines. Purchase rates (₹) masked.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Role switcher active in sidebar
            </span>
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Ledger */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Immutable Audit Trail Ledger
            </h3>
            <p className="text-xs text-slate-400">
              Complete historical record of every stock inward, consumption, correction, and import
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/50">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Entity</th>
                <th className="py-3 px-3">Ref ID</th>
                <th className="py-3 px-3">Details / Transaction Log</th>
                <th className="py-3 px-3 text-right">User / Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#162035]/50 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-400">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action === 'INWARD'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action === 'CONSUME'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : log.action === 'IMPORT'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : log.action === 'DELETE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans font-semibold text-white">{log.entityName}</td>
                  <td className="py-3 px-3 text-amber-400 font-bold">{log.entityId}</td>
                  <td className="py-3 px-3 font-sans text-slate-300">{log.details}</td>
                  <td className="py-3 px-3 font-sans text-slate-400 text-right">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
