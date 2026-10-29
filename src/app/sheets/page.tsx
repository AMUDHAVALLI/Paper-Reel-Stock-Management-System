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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 font-heading">
            <Box className="w-6 h-6 text-amber-600" />
            Cut Sheet & Duplex Stock Management
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Track flat paperboard sheets (e.g. 62 × 77, 91 × 65.5 cm) for sheet-fed printing and die cutting.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 btn-theme-primary text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Sheet Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl theme-card bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">Available Sheet Stock</span>
          <h3 className="text-2xl font-black font-heading text-emerald-600 mt-1">
            {totalBalanceWeight.toFixed(1)} KG
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Ready for printing / punching</p>
        </div>
        <div className="p-5 rounded-2xl theme-card bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">Total Inward Weight</span>
          <h3 className="text-2xl font-black font-heading text-amber-600 mt-1">
            {totalSheetWeight.toFixed(1)} KG
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">{sheets.length} Batches inwarded</p>
        </div>
        <div className="p-5 rounded-2xl theme-card bg-white border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold font-heading">Stock Valuation</span>
          <h3 className="text-2xl font-black font-heading text-purple-600 mt-1">
            {isOperator ? '••••••' : `₹${totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">Balance stock asset value</p>
        </div>
      </div>

      {/* Sheet Stock Table */}
      <div className="theme-card bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm font-heading">Cut Sheet Inventory</h3>
          <span className="text-xs text-amber-600 font-mono font-bold">{sheets.length} Batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-heading font-bold">
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
            <tbody className="divide-y divide-slate-100 font-mono">
              {sheets.map((sheet) => (
                <tr key={sheet.id} className="hover:bg-amber-500/5 transition-colors">
                  <td className="py-3 px-3 font-sans text-slate-600">{sheet.inwardDate}</td>
                  <td className="py-3 px-3 font-bold text-amber-600">{sheet.reelNo}</td>
                  <td className="py-3 px-3 font-sans font-extrabold text-slate-900">{sheet.sizeDesc}</td>
                  <td className="py-3 px-3 text-slate-600">{sheet.gsm} GSM</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{sheet.millName}</td>
                  <td className="py-3 px-3 text-right text-slate-500">{sheet.weight}</td>
                  <td className="py-3 px-3 text-right text-slate-500">{sheet.usedWeight}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">
                    {sheet.balanceWeight}
                  </td>
                  {!isOperator && (
                    <td className="py-3 px-3 text-right text-slate-700">₹{sheet.pricePerKg}</td>
                  )}
                  {!isOperator && (
                    <td className="py-3 px-3 text-right font-semibold text-amber-600">
                      ₹{sheet.balanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                    </td>
                  )}
                  <td className="py-3 px-3 text-right font-sans">
                    {sheet.balanceWeight > 0 && (
                      <button
                        onClick={() => setSelectedSheetForConsume(sheet)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white font-semibold text-[11px] border border-amber-200 transition-all flex items-center gap-1 ml-auto shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="theme-card bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="font-heading font-bold text-slate-900 text-base mb-4">Add Cut Sheet Batch</h3>
            <form onSubmit={handleAddSheet} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Batch / Reference #</label>
                <input
                  type="text"
                  value={form.reelNo}
                  onChange={(e) => setForm({ ...form, reelNo: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Dimensions (e.g. 62 X 77 CM)</label>
                <input
                  type="text"
                  value={form.sizeDesc}
                  onChange={(e) => setForm({ ...form, sizeDesc: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">GSM</label>
                  <input
                    type="number"
                    value={form.gsm}
                    onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none font-bold transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mill Supplier</label>
                  <input
                    type="text"
                    value={form.millName}
                    onChange={(e) => setForm({ ...form, millName: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Price / KG (₹)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={form.pricePerKg}
                    onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-theme-secondary px-4 py-2 rounded-xl text-slate-700 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-theme-primary px-5 py-2 text-white rounded-xl font-heading font-bold shadow-xs"
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
