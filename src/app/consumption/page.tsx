'use client';

import React, { useEffect, useState } from 'react';
import {
  Scissors,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Factory,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';
import { Reel, ConsumptionLog } from '@/lib/types';

export default function ConsumptionPage() {
  const { currentRole, triggerRefresh, refreshKey } = useApp();
  const [reels, setReels] = useState<Reel[]>([]);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Selected Reel
  const [searchReel, setSearchReel] = useState('');
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

  // Issue Form
  const [consumedWeight, setConsumedWeight] = useState('');
  const [machineId, setMachineId] = useState('Corrugator Line 1');
  const [jobOrderNo, setJobOrderNo] = useState('');
  const [consumedDate, setConsumedDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOperator = currentRole === 'OPERATOR';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reelsRes, statsRes] = await Promise.all([
        fetch('/api/reels'),
        fetch('/api/stats'),
      ]);

      const reelsData = await reelsRes.json();
      const statsData = await statsRes.json();

      if (reelsData.success) {
        setReels(reelsData.data);
      }
      if (statsData.success) {
        setLogs(statsData.data.recentConsumption || []);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Filter available reels with balance > 0
  const availableReels = reels.filter((r) => r.balanceWeight > 0);

  // Handle Reel Select by search or click
  const handleSelectReel = (r: Reel) => {
    setSelectedReel(r);
    setConsumedWeight('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const numConsumed = parseFloat(consumedWeight) || 0;
  const balanceAfter = selectedReel ? Math.max(0, selectedReel.balanceWeight - numConsumed) : 0;

  const handleFullRoll = () => {
    if (selectedReel) {
      setConsumedWeight(selectedReel.balanceWeight.toString());
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReel) return;

    if (numConsumed <= 0) {
      setErrorMsg('Please enter a valid consumed weight in KG');
      return;
    }

    if (numConsumed > selectedReel.balanceWeight + 0.001) {
      setErrorMsg(`Cannot consume ${numConsumed} KG. Available balance is only ${selectedReel.balanceWeight} KG.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/reels/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reelId: selectedReel.id,
          consumedWeight: numConsumed,
          machineId,
          jobOrderNo: jobOrderNo.trim() || undefined,
          consumedDate,
          remarks: remarks.trim() || undefined,
          user: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to issue reel');
      }

      let successText = `Successfully consumed ${numConsumed} KG from Reel #${selectedReel.reelNo}! Balance remaining: ${data.data.reel.balanceWeight} KG`;
      if (data.data?.emailAlert?.triggered) {
        successText += ` • ⚠️ Low Balance Alert (<= 20%): Email sent to owner (${data.data.emailAlert.recipient})`;
      }
      setSuccessMsg(successText);
      setSelectedReel(null);
      setConsumedWeight('');
      setJobOrderNo('');
      setRemarks('');
      triggerRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 font-heading">
          <Scissors className="w-6 h-6 text-amber-600" />
          Reel Consumption & Machine Issue (Stock Out)
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Issue paper rolls to corrugation lines or sheeters, log partial usages, and maintain real-time roll balance.
        </p>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Selection & Issue Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Roll Selection & Lookup (5 cols) */}
        <div className="lg:col-span-5 theme-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[620px]">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2 font-heading">
            <Layers className="w-4 h-4 text-amber-600" />
            Select Roll to Issue ({availableReels.length} Available)
          </h3>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Reel #, Size (e.g. 90.5), Mill..."
              value={searchReel}
              onChange={(e) => setSearchReel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
            />
          </div>

          {/* Roll List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {availableReels
              .filter(
                (r) =>
                  !searchReel ||
                  r.reelNo.toLowerCase().includes(searchReel.toLowerCase()) ||
                  r.millName.toLowerCase().includes(searchReel.toLowerCase()) ||
                  r.sizeDesc.toLowerCase().includes(searchReel.toLowerCase()) ||
                  r.category.toLowerCase().includes(searchReel.toLowerCase())
              )
              .map((r) => {
                const isSelected = selectedReel?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReel(r)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200/80 hover:border-amber-500/40 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold font-mono text-amber-600 text-sm">
                        Reel #{r.reelNo}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {r.balanceWeight} KG Bal
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span>{r.sizeDesc} • {r.gsm} GSM</span>
                      <span className="text-slate-500">{r.millName}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Col: Issue / Consumption Workspace (7 cols) */}
        <div className="lg:col-span-7 theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          {selectedReel ? (
            <form onSubmit={handleIssueSubmit} className="space-y-5">
              {/* Selected Roll Header Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-amber-300/60 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    Selected For Issue
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Inward Date: {selectedReel.inwardDate}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs mt-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Reel #</span>
                    <strong className="text-amber-600 font-mono text-sm">{selectedReel.reelNo}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Mill</span>
                    <strong className="text-slate-900 text-xs">{selectedReel.millName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Deckle / GSM</span>
                    <strong className="text-slate-900 text-xs">{selectedReel.sizeDesc} • {selectedReel.gsm}G</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Current Balance</span>
                    <strong className="text-emerald-600 font-mono text-sm">{selectedReel.balanceWeight} KG</strong>
                  </div>
                </div>
              </div>

              {/* Consumption Inputs */}
              <div className="space-y-4">
                {/* Weight Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Consumed Weight (KG) <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleFullRoll}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline"
                    >
                      Use Full Roll ({selectedReel.balanceWeight} KG)
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max={selectedReel.balanceWeight}
                      value={consumedWeight}
                      onChange={(e) => setConsumedWeight(e.target.value)}
                      placeholder={`Enter KG consumed on machine (Max: ${selectedReel.balanceWeight})`}
                      required
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-4 py-3 text-base text-slate-800 font-mono font-bold placeholder-slate-400 outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                      KG
                    </span>
                  </div>
                </div>

                {/* Balance Prediction Card */}
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Remaining Balance after this run:</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      balanceAfter === 0 ? 'text-slate-500' : 'text-emerald-600'
                    }`}
                  >
                    {balanceAfter.toFixed(2)} KG {balanceAfter === 0 && '(Roll Completely Closed)'}
                  </span>
                </div>

                {/* Machine Line & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Corrugator / Machine Line</label>
                    <select
                      value={machineId}
                      onChange={(e) => setMachineId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                    >
                      <option value="Corrugator Line 1">Corrugator Line 1 (Main Fluter)</option>
                      <option value="Corrugator Line 2">Corrugator Line 2</option>
                      <option value="Sheet Cutter Machine">Sheet Cutter Machine</option>
                      <option value="Rotary Slotter / Die Cutter">Rotary Slotter / Die</option>
                      <option value="Sampling / Manual">Sampling / Manual</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Consumption Date</label>
                    <input
                      type="date"
                      value={consumedDate}
                      onChange={(e) => setConsumedDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Job Order & Remarks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Job Order / Box Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. JO-4011 / 5-Ply Master Carton"
                      value={jobOrderNo}
                      onChange={(e) => setJobOrderNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none placeholder-slate-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700">Operator Remarks</label>
                    <input
                      type="text"
                      placeholder="e.g. 200 boxes run, remaining 141 kg"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl px-3 py-2 text-slate-800 outline-none placeholder-slate-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedReel(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 btn-theme-primary text-xs font-bold disabled:opacity-50"
                >
                  <Scissors className="w-4 h-4" />
                  <span>{submitting ? 'Recording Issue...' : 'Confirm Roll Issue'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Scissors className="w-16 h-16 text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-800 mb-1">No Reel Selected</h4>
              <p className="text-xs max-w-sm text-slate-500">
                Select a roll from the left panel or search by Reel Number to record machine consumption.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Consumption History Table */}
      <div className="theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <Clock className="w-5 h-5 text-amber-600" />
              Recent Consumption & Issue Logs
            </h3>
            <p className="text-xs text-slate-500 font-medium">Audit trail of paper rolls issued to machines</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider bg-slate-50 font-heading font-bold">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Reel #</th>
                <th className="py-3 px-3 text-right">Consumed (KG)</th>
                <th className="py-3 px-3 text-right">Balance After</th>
                {!isOperator && <th className="py-3 px-3 text-right">Consumed Value</th>}
                <th className="py-3 px-3">Machine Line</th>
                <th className="py-3 px-3">Job / Box Ref</th>
                <th className="py-3 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No consumption logs recorded yet. Issue a roll above to see live updates.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-500/5 transition-colors">
                    <td className="py-3 px-3 font-sans text-slate-600">{log.consumedDate}</td>
                    <td className="py-3 px-3 font-bold text-amber-600">{log.reelNo}</td>
                    <td className="py-3 px-3 text-right text-rose-600 font-bold">
                      -{log.consumedWeight} KG
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600">
                      {log.balanceAfter} KG
                    </td>
                    {!isOperator && (
                      <td className="py-3 px-3 text-right text-slate-800 font-medium">
                        ₹{log.amount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                      </td>
                    )}
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{log.machineId || 'Corrugator'}</td>
                    <td className="py-3 px-3 font-sans text-slate-500">{log.jobOrderNo || '-'}</td>
                    <td className="py-3 px-3 font-sans text-slate-500">{log.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
