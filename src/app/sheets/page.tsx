'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Layers,
  Search,
  Plus,
  Scissors,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '@/components/AppShell';
import { Reel } from '@/lib/types';
import ConsumeModal from '@/components/ConsumeModal';

export default function CutSheetsPage() {
  const { currentRole, refreshKey } = useApp();
  const [sheets, setSheets] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // New Sheet Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSheetForConsume, setSelectedSheetForConsume] = useState<Reel | null>(null);

  // Form State
  const [form, setForm] = useState({
    inwardDate: new Date().toISOString().split('T')[0],
    category: 'CUT SHEET 230 GSM',
    reelNo: 'SHEET-BATCH-01',
    sizeDesc: '62 X 77 CM',
    gsm: '230',
    weight: '2000',
    pricePerKg: '48.25',
    millName: 'ORCHID',
    sheetCount: '1500',
    bayLocation: 'Sheet Stacking Bay S-1',
  });

  const isOperator = currentRole === 'OPERATOR';

  const fetchSheets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reels?isSheet=true');
      const data = await res.json();
      if (data.success) {
        setSheets(data.data);
      }
    } catch (err) {
      console.error('Failed to load sheets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheets();
  }, [refreshKey]);

  const handleAddSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          itemType: 'CUT_SHEET',
          isSheet: true,
          user: currentRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchSheets();
      }
    } catch (err) {
      console.error('Failed to add sheet:', err);
    }
  };

  const totalSheetWeight = sheets.reduce((s, r) => s + r.weight, 0);
  const totalBalanceWeight = sheets.reduce((s, r) => s + r.balanceWeight, 0);
  const totalValuation = sheets.reduce((s, r) => s + r.balanceAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Box className="w-6 h-6 text-amber-400" />
            Cut Sheet & Duplex Stock Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track flat paperboard sheets (e.g. 62 × 77, 91 × 65.5 cm) for sheet-fed printing and die cutting.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sheet Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#111726] border border-emerald-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Available Sheet Stock</span>
          <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {totalBalanceWeight.toFixed(1)} KG
          </h3>
          <p className="text-xs text-slate-500 mt-1">Ready for printing / punching</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#111726] border border-amber-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Inward Weight</span>
          <h3 className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {totalSheetWeight.toFixed(1)} KG
          </h3>
          <p className="text-xs text-slate-500 mt-1">{sheets.length} Batches inwarded</p>
        </div>
        <div className="p-5 rounded-2xl bg-[#111726] border border-purple-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Stock Valuation</span>
          <h3 className="text-2xl font-bold font-mono text-purple-400 mt-1">
            {isOperator ? '••••••' : `₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Balance stock asset value</p>
        </div>
      </div>

      {/* Sheet Stock Table */}
      <div className="bg-[#111726] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#162035] border-b border-[#1e293b] flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Cut Sheet Inventory</h3>
          <span className="text-xs text-amber-400 font-mono">{sheets.length} Batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#23314e] text-slate-400 uppercase text-[10px] tracking-wider bg-[#0d121f]/50">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Batch / Ref #</th>
                <th className="py-3 px-3">Sheet Size (CM)</th>
                <th className="py-3 px-3">GSM</th>
                <th className="py-3 px-3">Mill Supplier</th>
                <th className="py-3 px-3 text-right">Inward Wt (KG)</th>
                <th className="py-3 px-3 text-right">Consumed (KG)</th>
                <th className="py-3 px-3 text-right">Balance Wt (KG)</th>
                {!isOperator && <th className="py-3 px-3 text-right">Rate / KG</th>}
                {!isOperator && <th className="py-3 px-3 text-right">Bal Amount</th>}
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/70 font-mono">
              {sheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-[#162035]/60 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-300">{sheet.inwardDate}</td>
                  <td className="py-3 px-3 font-bold text-amber-400">{sheet.reelNo}</td>
                  <td className="py-3 px-3 font-sans font-extrabold text-white">{sheet.sizeDesc}</td>
                  <td className="py-3 px-3 text-slate-300">{sheet.gsm} GSM</td>
                  <td className="py-3 px-3 font-sans font-bold text-white">{sheet.millName}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{sheet.weight}</td>
                  <td className="py-3 px-3 text-right text-slate-400">{sheet.usedWeight}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {sheet.balanceWeight}
                  </td>
                  {!isOperator && (
                    <td className="py-3 px-3 text-right text-slate-300">₹{sheet.pricePerKg}</td>
                  )}
                  {!isOperator && (
                    <td className="py-3 px-3 text-right font-semibold text-amber-300">
                      ₹{sheet.balanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-sans">
                    {sheet.balanceWeight > 0 && (
                      <button
                        onClick={() => setSelectedSheetForConsume(sheet)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white font-semibold text-[11px] border border-amber-500/30 transition-all flex items-center gap-1 ml-auto"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Issue</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Sheet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23314e] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4">Add Cut Sheet Batch</h3>
            <form onSubmit={handleAddSheet} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Batch / Reference #</label>
                <input
                  type="text"
                  value={form.reelNo}
                  onChange={(e) => setForm({ ...form, reelNo: e.target.value })}
                  required
                  className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Dimensions (e.g. 62 X 77 CM)</label>
                <input
                  type="text"
                  value={form.sizeDesc}
                  onChange={(e) => setForm({ ...form, sizeDesc: e.target.value })}
                  required
                  className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">GSM</label>
                  <input
                    type="number"
                    value={form.gsm}
                    onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                    required
                    className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    required
                    className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Mill Supplier</label>
                  <input
                    type="text"
                    value={form.millName}
                    onChange={(e) => setForm({ ...form, millName: e.target.value.toUpperCase() })}
                    className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Price / KG (₹)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={form.pricePerKg}
                    onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                    className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-[#1e293b] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#23314e] rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-md"
                >
                  Save Sheet Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consumption Modal */}
      <ConsumeModal
        reel={selectedSheetForConsume}
        isOpen={Boolean(selectedSheetForConsume)}
        onClose={() => setSelectedSheetForConsume(null)}
        onSuccess={() => fetchSheets()}
      />
    </div>
  );
}
