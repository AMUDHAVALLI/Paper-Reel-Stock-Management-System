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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            FULL ROLL
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            PARTIAL
          </span>
        );
      case 'EXHAUSTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 font-heading">
            <Layers className="w-6 h-6 text-amber-600" />
            Live Reel Stock Register
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Complete inventory matching OM Namasivayam Packaging ledger (Kraft, White Liners, Fluting, Cut Sheets)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grouped'
                  ? 'btn-theme-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Excel GSM Sections
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'flat'
                  ? 'btn-theme-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Master Flat Table
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl btn-theme-secondary text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="theme-card bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Reel #, Size (e.g. 90.5), Mill, GSM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
          />
        </div>

        {/* GSM Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">GSM:</span>
          <select
            value={selectedGsm}
            onChange={(e) => setSelectedGsm(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-2.5 py-2 outline-none focus:border-amber-500 focus:bg-white transition-colors"
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
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">Mill:</span>
          <select
            value={selectedMill}
            onChange={(e) => setSelectedMill(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-2.5 py-2 outline-none focus:border-amber-500 focus:bg-white transition-colors"
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
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl px-2.5 py-2 outline-none focus:border-amber-500 focus:bg-white transition-colors"
          >
            <option value="ALL">All Status</option>
            <option value="IN_STOCK">Full Roll</option>
            <option value="PARTIAL">Partially Used</option>
            <option value="EXHAUSTED">Exhausted (Closed)</option>
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-mono">
          Showing <strong className="text-amber-600 font-bold">{filteredReels.length}</strong> of {reels.length} rolls
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
                className="theme-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Section Header Accordion */}
                <div
                  onClick={() => toggleGroup(category)}
                  className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-amber-600">
                      {isCollapsed ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2 font-heading">
                        {category}
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                          {items.length} rolls
                        </span>
                      </h3>
                    </div>
                  </div>

                  {/* Group Subtotals Banner */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500">
                      Inward: <strong className="text-slate-800">{groupTotalWeight.toFixed(1)} KG</strong>
                    </span>
                    <span className="text-slate-500">
                      Used: <strong className="text-amber-600 font-bold">{groupUsedWeight.toFixed(1)} KG</strong>
                    </span>
                    <span className="text-slate-500">
                      Bal Stock: <strong className="text-emerald-600 font-bold">{groupBalanceWeight.toFixed(1)} KG</strong>
                    </span>
                    {!isOperator && (
                      <span className="text-slate-500 pl-3 border-l border-slate-200">
                        Bal Value: <strong className="text-amber-600 font-bold">{formatCurrency(groupBalanceAmount)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Content Table */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-heading font-bold">
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
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {items.map((reel, idx) => (
                          <tr
                            key={reel.id}
                            className={`hover:bg-amber-500/5 transition-colors ${
                              reel.status === 'EXHAUSTED' ? 'opacity-60 bg-slate-50/50' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3 text-slate-600 font-sans">{reel.inwardDate}</td>
                            <td className="py-3 px-3 font-bold text-amber-600">{reel.reelNo}</td>
                            <td className="py-3 px-3 font-sans font-bold text-slate-900">{reel.sizeDesc}</td>
                            <td className="py-3 px-3 text-slate-600">{reel.gsm}</td>
                            <td className="py-3 px-3 text-slate-600">{reel.bf || '-'}</td>
                            <td className="py-3 px-3 text-right text-slate-600">{reel.weight}</td>
                            <td className="py-3 px-3 text-right text-slate-500">{reel.usedWeight}</td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-600">
                              {reel.balanceWeight}
                            </td>
                            <td className="py-3 px-3 text-slate-500 font-sans">{reel.usedDate || '-'}</td>
                            {!isOperator && (
                              <td className="py-3 px-3 text-right text-slate-700">₹{reel.pricePerKg}</td>
                            )}
                            {!isOperator && (
                              <td className="py-3 px-3 text-right font-bold text-amber-600">
                                {formatCurrency(reel.balanceAmount)}
                              </td>
                            )}
                            <td className="py-3 px-3 font-sans font-bold text-slate-900">{reel.millName}</td>
                            <td className="py-3 px-3 text-center font-sans">
                              {getStatusBadge(reel.status)}
                            </td>
                            <td className="py-3 px-3 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setQrReel(reel)}
                                  title="Print Label & QR"
                                  className="p-1.5 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-600 text-slate-600 border border-slate-200 transition-colors shadow-xs"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-amber-600" />
                                </button>
                                {reel.balanceWeight > 0 && (
                                  <button
                                    onClick={() => setConsumeReel(reel)}
                                    className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-bold text-[11px] border border-amber-200 transition-all flex items-center gap-1 shadow-xs"
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
        <div className="theme-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-heading font-bold">
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
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredReels.map((reel, idx) => (
                  <tr
                    key={reel.id}
                    className={`hover:bg-amber-500/5 transition-colors ${
                      reel.status === 'EXHAUSTED' ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-sans text-slate-600">{reel.inwardDate}</td>
                    <td className="py-3 px-3 font-bold text-amber-600">{reel.reelNo}</td>
                    <td className="py-3 px-3 font-sans text-slate-500">{reel.category}</td>
                    <td className="py-3 px-3 font-sans font-bold text-slate-900">{reel.sizeDesc}</td>
                    <td className="py-3 px-3 text-slate-600">{reel.gsm}</td>
                    <td className="py-3 px-3 text-slate-600">{reel.bf || '-'}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{reel.weight}</td>
                    <td className="py-3 px-3 text-right text-slate-500">{reel.usedWeight}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {reel.balanceWeight}
                    </td>
                    {!isOperator && (
                      <td className="py-3 px-3 text-right text-slate-700">₹{reel.pricePerKg}</td>
                    )}
                    {!isOperator && (
                      <td className="py-3 px-3 text-right font-bold text-amber-600">
                        {formatCurrency(reel.balanceAmount)}
                      </td>
                    )}
                    <td className="py-3 px-3 font-sans font-bold text-slate-900">{reel.millName}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      {getStatusBadge(reel.status)}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrReel(reel)}
                          title="Print Label & QR"
                          className="p-1.5 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-600 text-slate-600 border border-slate-200 transition-colors shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                        {reel.balanceWeight > 0 && (
                          <button
                            onClick={() => setConsumeReel(reel)}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-bold text-[11px] border border-amber-200 transition-all flex items-center gap-1 shadow-xs"
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
