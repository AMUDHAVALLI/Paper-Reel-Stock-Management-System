'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  Factory,
  Layers,
  DollarSign,
  Boxes,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '@/components/AppShell';
import { StockSummary, Reel, ConsumptionLog } from '@/lib/types';

export default function ValuationReportsPage() {
  const { currentRole, refreshKey } = useApp();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const isOperator = currentRole === 'OPERATOR';

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then((r) => r.json()),
      fetch('/api/reels').then((r) => r.json()),
    ]).then(([statsData, reelsData]) => {
      if (statsData.success) {
        setSummary(statsData.data.summary);
        setLogs(statsData.data.recentConsumption || []);
      }
      if (reelsData.success) {
        setReels(reelsData.data);
      }
      setLoading(false);
    });
  }, [refreshKey]);

  const formatCurrency = (amt: number = 0) => {
    if (isOperator) return '••••••';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(amt);
  };

  const formatKg = (kg: number = 0) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(kg) + ' KG';
  };

  const handleExportFullValuation = () => {
    if (!summary) return;

    // Build Excel Workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Valuation
    const summaryRows = [
      { Metric: 'Company Name', Value: 'OM NAMASIVAYAM PACKAGING' },
      { Metric: 'Financial Year', Value: '2026-2027' },
      { Metric: 'Total Rolls Received', Value: summary.totalReels },
      { Metric: 'Total Weight Received (KG)', Value: summary.totalWeight },
      { Metric: 'Total Consumed Weight (KG)', Value: summary.usedWeight },
      { Metric: 'Available Balance Stock (KG)', Value: summary.balanceWeight },
      { Metric: 'Total Stock Valuation (₹)', Value: summary.totalAmount },
      { Metric: 'Total Consumed Valuation (₹)', Value: summary.consumedAmount },
      { Metric: 'Available Balance Valuation (₹)', Value: summary.balanceAmount },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Valuation Summary');

    // Sheet 2: GSM Breakdown
    const gsmRows = Object.entries(summary.byGsm).map(([cat, s]) => ({
      Category: cat,
      Rolls: s.count,
      'Total Weight (KG)': s.totalWeight,
      'Consumed (KG)': s.usedWeight,
      'Balance (KG)': s.balanceWeight,
      'Total Valuation (₹)': s.totalAmount,
      'Balance Valuation (₹)': s.balanceAmount,
    }));
    const ws2 = XLSX.utils.json_to_sheet(gsmRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'GSM Breakdown');

    // Sheet 3: Mill Suppliers
    const millRows = Object.entries(summary.byMill).map(([m, s]) => ({
      'Mill Supplier': m,
      Rolls: s.count,
      'Total Weight (KG)': s.totalWeight,
      'Balance (KG)': s.balanceWeight,
      'Total Valuation (₹)': s.totalAmount,
    }));
    const ws3 = XLSX.utils.json_to_sheet(millRows);
    XLSX.utils.book_append_sheet(wb, ws3, 'Mill Analysis');

    XLSX.writeFile(wb, `Stock_Valuation_Audit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            Stock Valuation & Audit Statements (FY 2026-2027)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Financial inventory reporting matching Om Namasivayam Packaging ledger summary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#162035] hover:bg-[#202d4b] border border-[#22314e] text-slate-300 font-semibold text-xs shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportFullValuation}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Export Valuation Excel</span>
          </button>
        </div>
      </div>

      {/* Official Audit Summary Table (Mirror of Row 181 in Excel) */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <div className="border-b border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Official Closing Stock Statement
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              OM NAMASIVAYAM PACKAGING • 2026-2027
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-center">
          <div className="p-4 rounded-xl bg-[#162035] border border-[#22314e]">
            <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">
              TOTAL STOCK INWARDED
            </span>
            <span className="text-xl font-bold text-white block">
              {summary ? formatKg(summary.totalWeight) : '...'}
            </span>
            <span className="text-[11px] text-slate-500 font-sans">{summary?.totalReels || 0} Total Rolls</span>
          </div>

          <div className="p-4 rounded-xl bg-[#162035] border border-emerald-500/30">
            <span className="text-[10px] uppercase text-emerald-400 font-sans block mb-1">
              AVAL BAL STOCK (LIVE)
            </span>
            <span className="text-xl font-bold text-emerald-400 block">
              {summary ? formatKg(summary.balanceWeight) : '...'}
            </span>
            <span className="text-[11px] text-emerald-500 font-sans">
              {summary ? summary.activeReels + summary.partialReels : 0} Available Rolls
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#162035] border border-[#22314e]">
            <span className="text-[10px] uppercase text-slate-400 font-sans block mb-1">
              TOTAL INWARD VALUATION
            </span>
            <span className="text-xl font-bold text-amber-300 block">
              {summary ? formatCurrency(summary.totalAmount) : '...'}
            </span>
            <span className="text-[11px] text-slate-500 font-sans">Total Paper Purchases</span>
          </div>

          <div className="p-4 rounded-xl bg-[#162035] border border-purple-500/30">
            <span className="text-[10px] uppercase text-purple-400 font-sans block mb-1">
              AVAL STOCK VALUATION
            </span>
            <span className="text-xl font-bold text-purple-400 block">
              {summary ? formatCurrency(summary.balanceAmount) : '...'}
            </span>
            <span className="text-[11px] text-purple-400 font-sans">Current Balance Asset</span>
          </div>
        </div>
      </div>

      {/* Detailed GSM Quality Valuation Breakdown */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-white text-sm mb-3">GSM & Quality Category Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/60 font-semibold">
                <th className="py-3 px-3">Quality Category</th>
                <th className="py-3 px-3 text-center">Rolls Count</th>
                <th className="py-3 px-3 text-right">Inward Weight (KG)</th>
                <th className="py-3 px-3 text-right">Consumed Weight (KG)</th>
                <th className="py-3 px-3 text-right">Balance Weight (KG)</th>
                <th className="py-3 px-3 text-center">Consumption %</th>
                {!isOperator && <th className="py-3 px-3 text-right">Inward Amount</th>}
                {!isOperator && <th className="py-3 px-3 text-right">Balance Amount</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {summary &&
                Object.entries(summary.byGsm).map(([cat, stats]) => {
                  const consumePct =
                    stats.totalWeight > 0
                      ? ((stats.usedWeight / stats.totalWeight) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={cat} className="hover:bg-[#162035]/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-white">{cat}</td>
                      <td className="py-3 px-3 text-center text-amber-400 font-semibold">
                        {stats.count}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {stats.totalWeight.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        {stats.usedWeight.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {stats.balanceWeight.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[11px] bg-[#0d121f] px-2 py-0.5 rounded-full border border-[#1e293b] text-slate-300">
                          {consumePct}%
                        </span>
                      </td>
                      {!isOperator && (
                        <td className="py-3 px-3 text-right text-slate-400">
                          {formatCurrency(stats.totalAmount)}
                        </td>
                      )}
                      {!isOperator && (
                        <td className="py-3 px-3 text-right font-bold text-amber-300">
                          {formatCurrency(stats.balanceAmount)}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mill Supplier Analysis */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
        <h3 className="font-bold text-white text-sm mb-3">Paper Mill Supplier Distribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/60 font-semibold">
                <th className="py-3 px-3">Mill / Supplier Name</th>
                <th className="py-3 px-3 text-center">Total Rolls</th>
                <th className="py-3 px-3 text-right">Total Tonnage (KG)</th>
                <th className="py-3 px-3 text-right">Available Balance (KG)</th>
                <th className="py-3 px-3 text-center">Share %</th>
                {!isOperator && <th className="py-3 px-3 text-right">Total Purchase Value</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {summary &&
                Object.entries(summary.byMill).map(([mill, stats]) => {
                  const share =
                    summary.totalWeight > 0
                      ? ((stats.totalWeight / summary.totalWeight) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={mill} className="hover:bg-[#162035]/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-amber-400">{mill}</td>
                      <td className="py-3 px-3 text-center text-slate-300">{stats.count}</td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {stats.totalWeight.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400">
                        {stats.balanceWeight.toFixed(1)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">{share}%</td>
                      {!isOperator && (
                        <td className="py-3 px-3 text-right font-semibold text-amber-300">
                          {formatCurrency(stats.totalAmount)}
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
