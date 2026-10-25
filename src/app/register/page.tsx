'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  Download,
  Scissors,
  QrCode,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Ban,
  Package,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '@/components/AppShell';
import { Reel, ReelStatus } from '@/lib/types';
import ConsumeModal from '@/components/ConsumeModal';
import QRCodeModal from '@/components/QRCodeModal';

export default function StockRegisterPage() {
  const { currentRole, globalSearch, refreshKey } = useApp();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGsm, setSelectedGsm] = useState<string>('ALL');
  const [selectedMill, setSelectedMill] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');

  // Collapsed sections for grouped view
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Modals
  const [consumeReel, setConsumeReel] = useState<Reel | null>(null);
  const [qrReel, setQrReel] = useState<Reel | null>(null);

  const isOperator = currentRole === 'OPERATOR';

  useEffect(() => {
    if (globalSearch) {
      setSearchTerm(globalSearch);
    }
  }, [globalSearch]);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reels');
      const data = await res.json();
      if (data.success) {
        setReels(data.data);
      }
    } catch (err) {
      console.error('Failed to load reels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, [refreshKey]);

  // Unique mills and GSMs for filter dropdowns
  const availableMills = Array.from(new Set(reels.map((r) => r.millName))).filter(Boolean);
  const availableGsms = Array.from(new Set(reels.map((r) => r.gsm))).sort((a, b) => a - b);

  // Filter logic
  const filteredReels = reels.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      r.reelNo.toLowerCase().includes(term) ||
      r.millName.toLowerCase().includes(term) ||
      r.sizeDesc.toLowerCase().includes(term) ||
      r.category.toLowerCase().includes(term);

    const matchesGsm = selectedGsm === 'ALL' || r.gsm.toString() === selectedGsm;
    const matchesMill = selectedMill === 'ALL' || r.millName.toLowerCase() === selectedMill.toLowerCase();
    const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;

    return matchesSearch && matchesGsm && matchesMill && matchesStatus;
  });

  // Group by category (mirroring the Excel sheet)
  const groupedReels: Record<string, Reel[]> = {};
  filteredReels.forEach((r) => {
    const cat = r.category || `${r.gsm} GSM`;
    if (!groupedReels[cat]) groupedReels[cat] = [];
    groupedReels[cat].push(r);
  });

  const toggleGroup = (cat: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Export to Excel function
  const handleExportExcel = () => {
    const exportRows = filteredReels.map((r, i) => ({
      'SL NO': i + 1,
      'DATE': r.inwardDate,
      'REEL NO': r.reelNo,
      'REEL SIZE': r.sizeDesc,
      'GSM': r.gsm,
      'BF': r.bf || '',
      'REEL WEIGHT': r.weight,
      'USED REEL': r.usedWeight,
      'BALANCE REEL QT': r.balanceWeight,
      'USED DATE': r.usedDate || '',
      'PRICE': isOperator ? '' : r.pricePerKg,
      'REEL AMOUNT': isOperator ? '' : r.reelAmount,
      'CONSUMED AMOUNT': isOperator ? '' : r.consumedAmount,
      'BAL REEL AMOUNT': isOperator ? '' : r.balanceAmount,
      'MILL NAME': r.millName,
      'STATUS': r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reel Stock Register');
    XLSX.writeFile(wb, `Paper_Reel_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (amount: number = 0) => {
    if (isOperator) return '••••';
    return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(amount);
  };

  const getStatusBadge = (status: ReelStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            FULL ROLL
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            PARTIAL
          </span>
        );
      case 'EXHAUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            EXHAUSTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-amber-400" />
            Live Reel Stock Register
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete inventory matching Om Namasivayam Packaging ledger (Kraft, White, Ruby, Cut Sheets)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-[#141d2f] border border-[#22314e] p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'grouped'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Excel GSM Sections
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'flat'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Master Flat Table
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#162035] hover:bg-[#202d4b] border border-[#22314e] text-amber-300 font-semibold text-xs shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-4 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Reel #, Size (e.g. 90.5), Mill, GSM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#162035] border border-[#23314e] focus:border-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 outline-none"
          />
        </div>

        {/* GSM Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">GSM:</span>
          <select
            value={selectedGsm}
            onChange={(e) => setSelectedGsm(e.target.value)}
            className="bg-[#162035] border border-[#23314e] text-xs text-white rounded-xl px-2.5 py-2 outline-none focus:border-amber-500"
          >
            <option value="ALL">All GSM</option>
            {availableGsms.map((gsm) => (
              <option key={gsm} value={gsm.toString()}>
                {gsm} GSM
              </option>
            ))}
          </select>
        </div>

        {/* Mill Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Mill:</span>
          <select
            value={selectedMill}
            onChange={(e) => setSelectedMill(e.target.value)}
            className="bg-[#162035] border border-[#23314e] text-xs text-white rounded-xl px-2.5 py-2 outline-none focus:border-amber-500"
          >
            <option value="ALL">All Mills</option>
            {availableMills.map((mill) => (
              <option key={mill} value={mill}>
                {mill}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#162035] border border-[#23314e] text-xs text-white rounded-xl px-2.5 py-2 outline-none focus:border-amber-500"
          >
            <option value="ALL">All Status</option>
            <option value="IN_STOCK">Full Roll</option>
            <option value="PARTIAL">Partially Used</option>
            <option value="EXHAUSTED">Exhausted (Closed)</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-400 font-mono">
          Showing <strong className="text-amber-400">{filteredReels.length}</strong> of {reels.length} rolls
        </div>
      </div>

      {/* Stock Table Views */}
      {viewMode === 'grouped' ? (
        /* Excel GSM Grouped Sections */
        <div className="space-y-4">
          {Object.entries(groupedReels).map(([category, items]) => {
            const isCollapsed = collapsedGroups[category];
            const groupTotalWeight = items.reduce((s, r) => s + r.weight, 0);
            const groupUsedWeight = items.reduce((s, r) => s + r.usedWeight, 0);
            const groupBalanceWeight = items.reduce((s, r) => s + r.balanceWeight, 0);
            const groupBalanceAmount = items.reduce((s, r) => s + r.balanceAmount, 0);

            return (
              <div
                key={category}
                className="bg-[#111726] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl"
              >
                {/* Section Header Accordion */}
                <div
                  onClick={() => toggleGroup(category)}
                  className="px-6 py-4 bg-[#141c2e] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-[#18233a] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-amber-400">
                      {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-bold text-white text-base tracking-tight flex items-center gap-2">
                        {category}
                        <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                          {items.length} rolls
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Group Subtotals Banner */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-400">
                      Inward: <strong className="text-slate-200">{groupTotalWeight.toFixed(1)} KG</strong>
                    </span>
                    <span className="text-slate-400">
                      Used: <strong className="text-amber-400">{groupUsedWeight.toFixed(1)} KG</strong>
                    </span>
                    <span className="text-slate-400">
                      Bal Stock: <strong className="text-emerald-400">{groupBalanceWeight.toFixed(1)} KG</strong>
                    </span>
                    {!isOperator && (
                      <span className="text-slate-400 pl-3 border-l border-[#243352]">
                        Bal Value: <strong className="text-amber-400">{formatCurrency(groupBalanceAmount)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Content Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/60 font-semibold">
                          <th className="py-2.5 px-3">SL</th>
                          <th className="py-2.5 px-3">Inward Date</th>
                          <th className="py-2.5 px-3">Reel #</th>
                          <th className="py-2.5 px-3">Size (Deckle)</th>
                          <th className="py-2.5 px-3">GSM</th>
                          <th className="py-2.5 px-3">BF</th>
                          <th className="py-2.5 px-3 text-right">Reel Wt (KG)</th>
                          <th className="py-2.5 px-3 text-right">Used Wt (KG)</th>
                          <th className="py-2.5 px-3 text-right">Balance Wt (KG)</th>
                          <th className="py-2.5 px-3">Used Date</th>
                          {!isOperator && <th className="py-2.5 px-3 text-right">Price / KG</th>}
                          {!isOperator && <th className="py-2.5 px-3 text-right">Bal Amount</th>}
                          <th className="py-2.5 px-3">Mill Name</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e293b]/70 font-mono">
                        {items.map((reel, idx) => (
                          <tr
                            key={reel.id}
                            className={`hover:bg-[#162035]/70 transition-colors ${
                              reel.status === 'EXHAUSTED' ? 'opacity-60 bg-[#0d121f]/30' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                            <td className="py-3 px-3 text-slate-300 font-sans">{reel.inwardDate}</td>
                            <td className="py-3 px-3 font-bold text-amber-400">{reel.reelNo}</td>
                            <td className="py-3 px-3 font-sans font-semibold text-white">{reel.sizeDesc}</td>
                            <td className="py-3 px-3 text-slate-300">{reel.gsm}</td>
                            <td className="py-3 px-3 text-slate-300">{reel.bf || '-'}</td>
                            <td className="py-3 px-3 text-right text-slate-300">{reel.weight}</td>
                            <td className="py-3 px-3 text-right text-slate-400">{reel.usedWeight}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400">
                              {reel.balanceWeight}
                            </td>
                            <td className="py-3 px-3 text-slate-400 font-sans">{reel.usedDate || '-'}</td>
                            {!isOperator && (
                              <td className="py-3 px-3 text-right text-slate-300">₹{reel.pricePerKg}</td>
                            )}
                            {!isOperator && (
                              <td className="py-3 px-3 text-right font-semibold text-amber-300">
                                {formatCurrency(reel.balanceAmount)}
                              </td>
                            )}
                            <td className="py-3 px-3 font-sans font-bold text-white">{reel.millName}</td>
                            <td className="py-3 px-3 text-center font-sans">
                              {getStatusBadge(reel.status)}
                            </td>
                            <td className="py-3 px-3 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQrReel(reel)}
                                  title="Print Label & QR"
                                  className="p-1.5 rounded-lg bg-[#141d2f] hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 border border-[#23314e] transition-colors"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                                {reel.balanceWeight > 0 && (
                                  <button
                                    onClick={() => setConsumeReel(reel)}
                                    className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white font-semibold text-[11px] border border-amber-500/30 transition-all flex items-center gap-1"
                                  >
                                    <Scissors className="w-3 h-3" />
                                    <span>Issue</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Master Flat Table */
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/70 font-semibold">
                  <th className="py-3 px-3">SL</th>
                  <th className="py-3 px-3">Inward Date</th>
                  <th className="py-3 px-3">Reel #</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Deckle Size</th>
                  <th className="py-3 px-3">GSM</th>
                  <th className="py-3 px-3">BF</th>
                  <th className="py-3 px-3 text-right">Inward (KG)</th>
                  <th className="py-3 px-3 text-right">Consumed (KG)</th>
                  <th className="py-3 px-3 text-right">Balance (KG)</th>
                  {!isOperator && <th className="py-3 px-3 text-right">Price / KG</th>}
                  {!isOperator && <th className="py-3 px-3 text-right">Bal Amount</th>}
                  <th className="py-3 px-3">Mill Name</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/70 font-mono">
                {filteredReels.map((reel, idx) => (
                  <tr
                    key={reel.id}
                    className={`hover:bg-[#162035]/70 transition-colors ${
                      reel.status === 'EXHAUSTED' ? 'opacity-60 bg-[#0d121f]/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-sans text-slate-300">{reel.inwardDate}</td>
                    <td className="py-3 px-3 font-bold text-amber-400">{reel.reelNo}</td>
                    <td className="py-3 px-3 font-sans text-slate-400">{reel.category}</td>
                    <td className="py-3 px-3 font-sans font-bold text-white">{reel.sizeDesc}</td>
                    <td className="py-3 px-3 text-slate-300">{reel.gsm}</td>
                    <td className="py-3 px-3 text-slate-300">{reel.bf || '-'}</td>
                    <td className="py-3 px-3 text-right text-slate-300">{reel.weight}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{reel.usedWeight}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      {reel.balanceWeight}
                    </td>
                    {!isOperator && (
                      <td className="py-3 px-3 text-right text-slate-300">₹{reel.pricePerKg}</td>
                    )}
                    {!isOperator && (
                      <td className="py-3 px-3 text-right font-semibold text-amber-300">
                        {formatCurrency(reel.balanceAmount)}
                      </td>
                    )}
                    <td className="py-3 px-3 font-sans font-bold text-white">{reel.millName}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      {getStatusBadge(reel.status)}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrReel(reel)}
                          title="Print Label & QR"
                          className="p-1.5 rounded-lg bg-[#141d2f] hover:bg-amber-500/20 hover:text-amber-400 text-slate-400 border border-[#23314e] transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {reel.balanceWeight > 0 && (
                          <button
                            onClick={() => setConsumeReel(reel)}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white font-semibold text-[11px] border border-amber-500/30 transition-all flex items-center gap-1"
                          >
                            <Scissors className="w-3 h-3" />
                            <span>Issue</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConsumeModal
        reel={consumeReel}
        isOpen={Boolean(consumeReel)}
        onClose={() => setConsumeReel(null)}
        onSuccess={() => {
          fetchReels();
        }}
      />

      <QRCodeModal
        reel={qrReel}
        isOpen={Boolean(qrReel)}
        onClose={() => setQrReel(null)}
      />
    </div>
  );
}
