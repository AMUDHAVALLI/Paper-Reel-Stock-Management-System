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
      {/* Top Banner / onpackaging.in Plant Aesthetic */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white p-6 rounded-2xl border border-amber-300/40 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider badge-pill-brand font-heading">
              70–90 TONNES / MONTH PLANT
            </span>
            <span className="text-xs text-slate-500 font-medium">
              OM Namasivayam Packaging • Puducherry
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-heading">
            Paper Reel Stock & Corrugation ERP
          </h2>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Sustainable Raw Material Inventory • Kraft Paper, Fluting Medium & White Top Liners
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inward"
            className="flex items-center gap-2 px-5 py-2.5 btn-theme-primary text-xs font-bold"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Inward New Roll</span>
          </Link>
          <Link
            href="/consumption"
            className="flex items-center gap-2 px-4 py-2.5 btn-theme-secondary text-xs font-semibold"
          >
            <Scissors className="w-4 h-4 text-amber-600" />
            <span>Issue to Line</span>
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
        <div className="lg:col-span-2 theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
                <Boxes className="w-5 h-5 text-amber-600" />
                Stock by GSM & Quality Category
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Kraft, White Liners, Fluting & Cut Sheets from Excel Register
              </p>
            </div>
            <Link
              href="/register"
              className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-bold font-heading"
            >
              <span>View Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {summary &&
              Object.entries(summary.byGsm).map(([category, stats]) => {
                return (
                  <div
                    key={category}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-amber-500/40 hover:bg-white transition-all group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                        {category}
                      </span>
                      <span className="text-[11px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                        {stats.count} Rolls
                      </span>
                    </div>

                    <div className="flex items-end justify-between text-xs mb-1.5 font-mono">
                      <span className="text-slate-600">Bal: <strong className="text-emerald-600 font-bold">{formatKg(stats.balanceWeight)}</strong></span>
                      <span className="text-slate-500 text-[11px]">Inward: {formatKg(stats.totalWeight)}</span>
                    </div>

                    {/* Progress Bar for Consumption */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-amber-500 h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(5, (stats.balanceWeight / (stats.totalWeight || 1)) * 100))}%`,
                        }}
                      />
                    </div>

                    {!isOperator && (
                      <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-1.5 border-t border-slate-200/60">
                        <span>Balance Value:</span>
                        <span className="text-amber-600 font-mono font-medium">
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
        <div className="theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
                  <Factory className="w-5 h-5 text-amber-600" />
                  Mill Suppliers
                </h3>
                <p className="text-xs text-slate-500 font-medium">Tonnage received per paper mill</p>
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
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 text-sm block font-heading">{mill}</span>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {stats.count} Rolls • {formatKg(stats.totalWeight)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-amber-600 font-black font-mono text-sm block">
                          {percent}%
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                          Bal: {formatKg(stats.balanceWeight)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <Link
              href="/reports"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl btn-theme-secondary text-xs font-semibold"
            >
              <span>Detailed Supplier Performance</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Available Reels Quick Action Table */}
      <div className="theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Available Reels Ready for Machine Issue
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Active stock available in warehouse for corrugation and sheeting
            </p>
          </div>
          <Link
            href="/register"
            className="text-xs text-amber-600 hover:text-amber-700 font-bold font-heading flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Stock (Excel Matrix)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-heading font-bold">
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
            <tbody className="divide-y divide-slate-100">
              {recentReels.map((reel) => (
                <tr
                  key={reel.id}
                  className="hover:bg-amber-500/5 transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-amber-600">
                    {reel.reelNo}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{reel.millName}</td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="font-semibold text-slate-900">{reel.sizeDesc}</span>
                    <span className="text-[10px] text-slate-500 block">{reel.category}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">
                    {reel.gsm} GSM {reel.bf ? `• ${reel.bf} BF` : ''}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 text-right">
                    {reel.weight}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600 text-right">
                    {reel.balanceWeight}
                  </td>
                  {!isOperator && (
                    <td className="py-3 px-3 font-mono text-slate-700 text-right font-medium">
                      ₹{reel.pricePerKg}
                    </td>
                  )}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        reel.status === 'IN_STOCK'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : reel.status === 'PARTIAL'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                        className="p-1.5 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-600 text-slate-600 border border-slate-200 transition-colors shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                      <button
                        onClick={() => setSelectedReelForConsume(reel)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-bold text-[11px] border border-amber-200 transition-all flex items-center gap-1 shadow-xs"
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
