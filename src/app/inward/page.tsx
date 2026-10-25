'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PackagePlus,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';
import QRCodeModal from '@/components/QRCodeModal';
import { Reel } from '@/lib/types';

export default function ReelInwardPage() {
  const router = useRouter();
  const { currentRole, triggerRefresh } = useApp();

  // Mode: Single Roll, Batch Invoice, or Excel Upload
  const [inwardMode, setInwardMode] = useState<'single' | 'batch' | 'excel'>('single');

  // Single Roll Form
  const [form, setForm] = useState({
    inwardDate: new Date().toISOString().split('T')[0],
    millName: 'ARULDEVI',
    reelNo: '',
    category: '100 GSM',
    sizeDesc: '90.5 CM',
    gsm: '100',
    bf: '16',
    weight: '',
    pricePerKg: '31',
    bayLocation: 'Bay A-1',
    financialYear: '2026-2027',
    remarks: '',
  });

  // Batch Rolls Form
  const [batchHeader, setBatchHeader] = useState({
    inwardDate: new Date().toISOString().split('T')[0],
    millName: 'ORCHID',
    category: '120 GSM',
    sizeDesc: '132 CM',
    gsm: '120',
    bf: '18',
    pricePerKg: '35.5',
    financialYear: '2026-2027',
  });

  const [batchRows, setBatchRows] = useState([
    { reelNo: '', weight: '', bayLocation: 'Bay B-1' },
    { reelNo: '', weight: '', bayLocation: 'Bay B-1' },
    { reelNo: '', weight: '', bayLocation: 'Bay B-1' },
  ]);

  // Excel Upload
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');

  // State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdReel, setCreatedReel] = useState<Reel | null>(null);

  const isOperator = currentRole === 'OPERATOR';

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          user: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to inward reel');
      }

      setCreatedReel(data.data);
      setSuccessMsg(`Reel #${data.data.reelNo} inwarded successfully (${data.data.weight} KG)!`);
      triggerRefresh();

      // Reset roll number & weight for fast entry of next roll
      setForm((prev) => ({
        ...prev,
        reelNo: '',
        weight: '',
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const validRows = batchRows.filter((r) => r.reelNo.trim() && parseFloat(r.weight) > 0);
    if (validRows.length === 0) {
      setErrorMsg('Please enter at least one valid Reel # and Weight');
      setLoading(false);
      return;
    }

    try {
      let count = 0;
      for (const row of validRows) {
        await fetch('/api/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...batchHeader,
            reelNo: row.reelNo.trim(),
            weight: parseFloat(row.weight),
            bayLocation: row.bayLocation,
            user: currentRole,
          }),
        });
        count++;
      }

      setSuccessMsg(`Successfully inwarded batch of ${count} reels!`);
      triggerRefresh();
      setBatchRows([
        { reelNo: '', weight: '', bayLocation: 'Bay B-1' },
        { reelNo: '', weight: '', bayLocation: 'Bay B-1' },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error inwarding batch');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      setErrorMsg('Please select an Excel file (.xlsx) to upload');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('mode', importMode);
      formData.append('user', currentRole);

      const res = await fetch('/api/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import Excel');
      }

      setSuccessMsg(data.message);
      triggerRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to import file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <PackagePlus className="w-6 h-6 text-amber-400" />
            Reel Inward & Purchase Entry (Stock In)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Receive paper rolls from mills, assign storage bays, and generate printable QR code stickers.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="bg-[#141d2f] border border-[#22314e] p-1 rounded-xl flex items-center text-xs">
          <button
            onClick={() => setInwardMode('single')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              inwardMode === 'single'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Single Roll Entry
          </button>
          <button
            onClick={() => setInwardMode('batch')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              inwardMode === 'batch'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Roll Invoice
          </button>
          <button
            onClick={() => setInwardMode('excel')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              inwardMode === 'excel'
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Excel File Import
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          {createdReel && (
            <button
              onClick={() => {}}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg font-medium flex items-center gap-1"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Mode 1: Single Roll Entry */}
      {inwardMode === 'single' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="border-b border-[#1e293b] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Roll Specifications & Mill Inward</h3>
              <span className="text-[11px] text-amber-400 font-mono">FY 2026-2027</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Inward Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Inward Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.inwardDate}
                  onChange={(e) => setForm({ ...form, inwardDate: e.target.value })}
                  required
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>

              {/* Paper Mill */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Paper Mill / Supplier <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  list="millList"
                  value={form.millName}
                  onChange={(e) => setForm({ ...form, millName: e.target.value.toUpperCase() })}
                  placeholder="e.g. ARULDEVI, ORCHID, VENKRAFT, NPPL"
                  required
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white uppercase outline-none"
                />
                <datalist id="millList">
                  <option value="ARULDEVI" />
                  <option value="ORCHID" />
                  <option value="VENKRAFT" />
                  <option value="NPPL" />
                  <option value="VAMSHADHARA" />
                </datalist>
              </div>

              {/* Reel Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Reel Number / Barcode ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.reelNo}
                  onChange={(e) => setForm({ ...form, reelNo: e.target.value })}
                  placeholder="e.g. 7067 or scan roll barcode"
                  required
                  autoFocus
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-slate-500 outline-none"
                />
              </div>

              {/* Category / Quality */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Category / Quality</label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const gsm = cat.match(/\d+/)?.[0] || '100';
                    setForm({ ...form, category: cat, gsm });
                  }}
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                >
                  <option value="100 GSM">100 GSM (Kraft)</option>
                  <option value="120 GSM">120 GSM (Kraft)</option>
                  <option value="140 GSM">140 GSM (Kraft)</option>
                  <option value="150 GSM">150 GSM (Kraft)</option>
                  <option value="180 GSM">180 GSM (Kraft)</option>
                  <option value="62 CM 180 RUBY">62 CM 180 RUBY (Specialty)</option>
                  <option value="200 GSM WHITE">200 GSM WHITE (Duplex Top Liner)</option>
                  <option value="250 GSM WHITE">250 GSM WHITE (Duplex Top Liner)</option>
                  <option value="CUT SHEET 230 GSM">CUT SHEET 230 GSM</option>
                  <option value="CUT SHEET 200 GSM">CUT SHEET 200 GSM</option>
                </select>
              </div>

              {/* Deckle / Reel Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Reel Size (Deckle) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  list="sizeList"
                  value={form.sizeDesc}
                  onChange={(e) => setForm({ ...form, sizeDesc: e.target.value })}
                  placeholder="e.g. 90.5 CM, 132 CM, 122 CM WHITE"
                  required
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
                <datalist id="sizeList">
                  <option value="90.5 CM" />
                  <option value="109 CM" />
                  <option value="114 CM" />
                  <option value="122 CM WHITE" />
                  <option value="123 CM" />
                  <option value="132 CM" />
                  <option value="62 CM RUBY" />
                  <option value="62 X 77" />
                  <option value="91X65.5" />
                </datalist>
              </div>

              {/* GSM & BF */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">GSM</label>
                  <input
                    type="number"
                    value={form.gsm}
                    onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                    required
                    className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">BF (Burst Factor)</label>
                  <input
                    type="number"
                    value={form.bf}
                    onChange={(e) => setForm({ ...form, bf: e.target.value })}
                    placeholder="e.g. 16, 18, 20"
                    className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              {/* Reel Weight (KG) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Reel Weight (KG) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g. 341 or 750"
                    required
                    className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold placeholder-slate-500 outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                    KG
                  </span>
                </div>
              </div>

              {/* Price / KG (INR) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Price / KG (₹) {isOperator && <span className="text-slate-500">(Masked)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type={isOperator ? 'password' : 'number'}
                    step="0.25"
                    value={isOperator ? '0' : form.pricePerKg}
                    disabled={isOperator}
                    onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
                    placeholder="31.50"
                    className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Bay / Storage Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Warehouse Location / Bay</label>
                <input
                  type="text"
                  value={form.bayLocation}
                  onChange={(e) => setForm({ ...form, bayLocation: e.target.value })}
                  placeholder="e.g. Bay A-1, Rack 3"
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Total Valuation Preview */}
            {!isOperator && form.weight && form.pricePerKg && (
              <div className="p-4 rounded-xl bg-[#0e1424] border border-[#1e293b] flex items-center justify-between text-xs">
                <span className="text-slate-400">Computed Reel Amount:</span>
                <span className="text-amber-400 font-mono font-bold text-base">
                  ₹{(parseFloat(form.weight || '0') * parseFloat(form.pricePerKg || '0')).toLocaleString('en-IN', {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <PackagePlus className="w-4 h-4" />
                <span>{loading ? 'Inwarding...' : 'Save & Inward Reel'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 2: Multi-Roll Batch Invoice */}
      {inwardMode === 'batch' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleBatchSubmit} className="space-y-6">
            <div className="border-b border-[#1e293b] pb-3">
              <h3 className="font-bold text-white text-sm">Common Invoice Details</h3>
              <p className="text-xs text-slate-400">All rolls below share these mill and GSM specifications</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Inward Date</label>
                <input
                  type="date"
                  value={batchHeader.inwardDate}
                  onChange={(e) => setBatchHeader({ ...batchHeader, inwardDate: e.target.value })}
                  className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Mill Name</label>
                <input
                  type="text"
                  value={batchHeader.millName}
                  onChange={(e) => setBatchHeader({ ...batchHeader, millName: e.target.value.toUpperCase() })}
                  className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Deckle / Size</label>
                <input
                  type="text"
                  value={batchHeader.sizeDesc}
                  onChange={(e) => setBatchHeader({ ...batchHeader, sizeDesc: e.target.value })}
                  className="w-full bg-[#162035] border border-[#243352] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">GSM / BF</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={batchHeader.gsm}
                    onChange={(e) => setBatchHeader({ ...batchHeader, gsm: e.target.value })}
                    className="w-1/2 bg-[#162035] border border-[#243352] rounded-xl px-2 py-2 text-white outline-none font-mono"
                    placeholder="GSM"
                  />
                  <input
                    type="number"
                    value={batchHeader.bf}
                    onChange={(e) => setBatchHeader({ ...batchHeader, bf: e.target.value })}
                    className="w-1/2 bg-[#162035] border border-[#243352] rounded-xl px-2 py-2 text-white outline-none font-mono"
                    placeholder="BF"
                  />
                </div>
              </div>
            </div>

            {/* Rolls Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                  Rolls In This Batch ({batchRows.length})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setBatchRows([...batchRows, { reelNo: '', weight: '', bayLocation: 'Bay B-1' }])
                  }
                  className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Roll</span>
                </button>
              </div>

              <div className="space-y-2">
                {batchRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#162035] border border-[#243352] flex items-center gap-3"
                  >
                    <span className="text-slate-500 font-mono text-xs w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Reel Number (e.g. 10650)"
                      value={row.reelNo}
                      onChange={(e) => {
                        const updated = [...batchRows];
                        updated[idx].reelNo = e.target.value;
                        setBatchRows(updated);
                      }}
                      className="flex-1 bg-[#101726] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Weight (KG)"
                      value={row.weight}
                      onChange={(e) => {
                        const updated = [...batchRows];
                        updated[idx].weight = e.target.value;
                        setBatchRows(updated);
                      }}
                      className="w-32 bg-[#101726] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Bay / Location"
                      value={row.bayLocation}
                      onChange={(e) => {
                        const updated = [...batchRows];
                        updated[idx].bayLocation = e.target.value;
                        setBatchRows(updated);
                      }}
                      className="w-32 bg-[#101726] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />
                    {batchRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBatchRows(batchRows.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Processing Batch...' : 'Inward Entire Batch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 3: Excel File Import */}
      {inwardMode === 'excel' && (
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleExcelUpload} className="space-y-6">
            <div className="border-b border-[#1e293b] pb-3">
              <h3 className="font-bold text-white text-sm">Upload Excel Spreadsheet</h3>
              <p className="text-xs text-slate-400">
                Directly import rolls from spreadsheets formatted like `REELS STOCK 26-27 NEW.xlsx`.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#243352] hover:border-amber-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#141d2f]/50 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-amber-400 mb-3" />
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                className="hidden"
                id="excelInput"
              />
              <label htmlFor="excelInput" className="cursor-pointer">
                <span className="font-bold text-sm text-white block">
                  {excelFile ? excelFile.name : 'Click to select or drag and drop Excel sheet'}
                </span>
                <span className="text-xs text-slate-400 mt-1 block">
                  Supports .xlsx files (OM NAMASIVAYAM format)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="text-slate-300 font-semibold">Import Mode:</label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="append"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-amber-500"
                />
                <span>Append New Rolls (Keep Existing)</span>
              </label>
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="text-amber-500"
                />
                <span>Replace Entire Inventory</span>
              </label>
            </div>

            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-end">
              <button
                type="submit"
                disabled={loading || !excelFile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Uploading & Parsing...' : 'Import Spreadsheet'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <QRCodeModal
        reel={createdReel}
        isOpen={Boolean(createdReel)}
        onClose={() => setCreatedReel(null)}
      />
    </div>
  );
}
