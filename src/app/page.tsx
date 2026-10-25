'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Scale,
  DollarSign,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Factory,
  PackagePlus,
  QrCode,
  FileSpreadsheet,
  ArrowUpRight,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import KPICard from '@/components/KPICard';
import { useApp } from '@/components/AppShell';
import { StockSummary, Reel, ConsumptionLog } from '@/lib/types';
import ConsumeModal from '@/components/ConsumeModal';
import QRCodeModal from '@/components/QRCodeModal';

export default function DashboardPage() {
  const { currentRole, refreshKey, setActiveCount } = useApp();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [recentReels, setRecentReels] = useState<Reel[]>([]);
  const [recentLogs, setRecentLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedReelForConsume, setSelectedReelForConsume] = useState<Reel | null>(null);
  const [selectedReelForQR, setSelectedReelForQR] = useState<Reel | null>(null);

  const isOperator = currentRole === 'OPERATOR';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, reelsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/reels?status=IN_STOCK'),
      ]);

      const statsData = await statsRes.json();
      const reelsData = await reelsRes.json();

      if (statsData.success) {
        setSummary(statsData.data.summary);
        setRecentLogs(statsData.data.recentConsumption || []);
        setActiveCount(statsData.data.summary.activeReels + statsData.data.summary.partialReels);
      }

      if (reelsData.success) {
        setRecentReels(reelsData.data.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const formatKg = (kg: number = 0) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(kg) + ' KG';
  };

  const formatCurrency = (amount: number = 0) => {
    if (isOperator) return '••••••';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#121a2c] via-[#16223b] to-[#111827] p-6 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Factory Inventory
            </span>
            <span className="text-xs text-slate-400">
              Corrugated Packaging ERP
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
            Paper Reel Stock Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of Kraft Reels, White Top Liners, Burst Factor & Consumption Balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inward"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Inward New Roll</span>
          </Link>
          <Link
            href="/consumption"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1e2a44] hover:bg-[#253556] text-amber-300 font-semibold text-xs border border-amber-500/30 transition-all"
          >
            <Scissors className="w-4 h-4" />
            <span>Issue Roll</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Available Balance Stock"
          value={summary ? formatKg(summary.balanceWeight) : '...'}
          subtitle={`Available across ${summary ? summary.activeReels + summary.partialReels : 0} active rolls`}
          icon={Scale}
          colorScheme="emerald"
          trend="Ready for production"
          trendPositive={true}
        />
        <KPICard
          title="Total Stock Received"
          value={summary ? formatKg(summary.totalWeight) : '...'}
          subtitle={`Total ${summary?.totalReels || 0} reels inwarded in FY 26-27`}
          icon={Layers}
          colorScheme="amber"
          trend="Historical Inwards"
        />
        <KPICard
          title="Available Stock Valuation"
          value={summary ? formatCurrency(summary.balanceAmount) : '...'}
          subtitle={isOperator ? 'Prices hidden for operator' : 'Live balance inventory value'}
          icon={DollarSign}
          colorScheme="purple"
          trend={isOperator ? 'Role: Masked' : 'Closing Stock Asset'}
          trendPositive={!isOperator}
        />
        <KPICard
          title="Consumed Weight"
          value={summary ? formatKg(summary.usedWeight) : '...'}
          subtitle={`Value: ${summary ? formatCurrency(summary.consumedAmount) : '...'}`}
          icon={Scissors}
          colorScheme="blue"
          trend="Issued to corrugator"
        />
      </div>

      {/* Main Content Grid: GSM Breakdown & Mill Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GSM Category Distribution (2 Cols) */}
        <div className="lg:col-span-2 bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-400" />
                Stock by GSM & Quality Category
              </h3>
              <p className="text-xs text-slate-400">
                Breakdown of Kraft, White Liners, Ruby & Cut Sheets from Excel Register
              </p>
            </div>
            <Link
              href="/register"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>View Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {summary &&
              Object.entries(summary.byGsm).map(([category, stats]) => {
                const percent =
                  summary.totalWeight > 0
                    ? ((stats.balanceWeight / stats.totalWeight) * 100).toFixed(0)
                    : '0';

                return (
                  <div
                    key={category}
                    className="p-4 rounded-xl bg-[#162035] border border-[#22314e] hover:border-amber-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                        {category}
                      </span>
                      <span className="text-[11px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                        {stats.count} Rolls
                      </span>
                    </div>

                    <div className="flex items-end justify-between text-xs mb-1.5 font-mono">
                      <span className="text-slate-400">Bal: <strong className="text-emerald-400 font-bold">{formatKg(stats.balanceWeight)}</strong></span>
                      <span className="text-slate-500 text-[11px]">Inward: {formatKg(stats.totalWeight)}</span>
                    </div>

                    {/* Progress Bar for Consumption */}
                    <div className="w-full bg-[#0d1322] h-2 rounded-full overflow-hidden border border-[#223049]">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(5, (stats.balanceWeight / (stats.totalWeight || 1)) * 100))}%`,
                        }}
                      />
                    </div>

                    {!isOperator && (
                      <div className="mt-2 text-[11px] text-slate-400 flex justify-between pt-1.5 border-t border-[#1e293b]/60">
                        <span>Balance Value:</span>
                        <span className="text-amber-400 font-mono font-medium">
                          {formatCurrency(stats.balanceAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Paper Mill / Supplier Share (1 Col) */}
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-amber-400" />
                  Mill Suppliers
                </h3>
                <p className="text-xs text-slate-400">Tonnage received per paper mill</p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {summary &&
                Object.entries(summary.byMill).map(([mill, stats]) => {
                  const percent =
                    summary.totalWeight > 0
                      ? ((stats.totalWeight / summary.totalWeight) * 100).toFixed(1)
                      : '0';

                  return (
                    <div
                      key={mill}
                      className="p-3 rounded-xl bg-[#162035] border border-[#22314e] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white text-sm block">{mill}</span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {stats.count} Rolls • {formatKg(stats.totalWeight)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-400 font-bold font-mono text-sm block">
                          {percent}%
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Bal: {formatKg(stats.balanceWeight)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e293b]">
            <Link
              href="/reports"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#162035] hover:bg-[#1d2a45] text-xs font-semibold text-slate-200 border border-[#22314e] transition-colors"
            >
              <span>Detailed Supplier Performance</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Available Reels Quick Action Table */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Available Reels Ready for Machine Issue
            </h3>
            <p className="text-xs text-slate-400">
              Active stock available in warehouse for corrugation and sheeting
            </p>
          </div>
          <Link
            href="/register"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Stock (Excel Matrix)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/50">
                <th className="py-3 px-3">Reel #</th>
                <th className="py-3 px-3">Mill</th>
                <th className="py-3 px-3">Category / Size</th>
                <th className="py-3 px-3">GSM / BF</th>
                <th className="py-3 px-3 text-right">Inward (KG)</th>
                <th className="py-3 px-3 text-right">Balance (KG)</th>
                {!isOperator && <th className="py-3 px-3 text-right">Rate / KG</th>}
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70">
              {recentReels.map((reel) => (
                <tr
                  key={reel.id}
                  className="hover:bg-[#162035]/60 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-amber-400">
                    {reel.reelNo}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">{reel.millName}</td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="font-semibold text-white">{reel.sizeDesc}</span>
                    <span className="text-[10px] text-slate-500 block">{reel.category}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    {reel.gsm} GSM {reel.bf ? `• ${reel.bf} BF` : ''}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-right">
                    {reel.weight}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400 text-right">
                    {reel.balanceWeight}
                  </td>
                  {!isOperator && (
                    <td className="py-3 px-3 font-mono text-slate-300 text-right">
                      ₹{reel.pricePerKg}
                    </td>
                  )}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                        reel.status === 'IN_STOCK'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : reel.status === 'PARTIAL'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {reel.status === 'IN_STOCK' ? 'FULL ROLL' : 'PARTIAL'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReelForQR(reel)}
                        title="Print QR Sticker"
                        className="p-1.5 rounded-lg bg-[#141d2f] hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 border border-[#23314e] transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedReelForConsume(reel)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white font-semibold text-[11px] border border-amber-500/30 transition-all flex items-center gap-1"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Issue</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ConsumeModal
        reel={selectedReelForConsume}
        isOpen={Boolean(selectedReelForConsume)}
        onClose={() => setSelectedReelForConsume(null)}
        onSuccess={() => {
          fetchData();
        }}
      />

      <QRCodeModal
        reel={selectedReelForQR}
        isOpen={Boolean(selectedReelForQR)}
        onClose={() => setSelectedReelForQR(null)}
      />
    </div>
  );
}
