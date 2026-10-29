'use client';

import React, { useState } from 'react';
import { X, Scissors, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Reel } from '@/lib/types';

interface ConsumeModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ConsumeModal({ reel, isOpen, onClose, onSuccess }: ConsumeModalProps) {
  const [consumedWeight, setConsumedWeight] = useState<string>('');
  const [machineId, setMachineId] = useState('Corrugator Line 1');
  const [jobOrderNo, setJobOrderNo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !reel) return null;

  const currentBalance = reel.balanceWeight;
  const numConsumed = parseFloat(consumedWeight) || 0;
  const remainingAfter = Math.max(0, currentBalance - numConsumed);

  const handleFullRoll = () => {
    setConsumedWeight(currentBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numConsumed <= 0) {
      setError('Please enter a valid consumption weight in KG');
      return;
    }

    if (numConsumed > currentBalance + 0.001) {
      setError(`Cannot consume ${numConsumed} KG. Available balance is only ${currentBalance} KG.`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/reels/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reelId: reel.id,
          consumedWeight: numConsumed,
          machineId,
          jobOrderNo: jobOrderNo.trim() || undefined,
          remarks: remarks.trim() || undefined,
          user: 'Store / Operator',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process consumption');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-sm">Issue / Consume Reel</h3>
              <p className="text-xs text-slate-500 font-mono">Reel #{reel.reelNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reel Specs Summary Banner */}
        <div className="px-6 py-3 bg-amber-50/50 border-b border-slate-200 grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Mill</span>
            <p className="font-semibold text-slate-900 truncate">{reel.millName}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Size / GSM</span>
            <p className="font-bold text-amber-700">{reel.sizeDesc} • {reel.gsm}G</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Inward Wt</span>
            <p className="font-semibold text-slate-700 font-mono">{reel.weight} KG</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Balance Wt</span>
            <p className="font-bold text-emerald-700 font-mono">{currentBalance} KG</p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Choice: Full or Partial */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Consumption Weight (KG) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleFullRoll}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-bold underline flex items-center gap-1"
              >
                Use Entire Roll ({currentBalance} KG)
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                max={currentBalance}
                value={consumedWeight}
                onChange={(e) => setConsumedWeight(e.target.value)}
                placeholder={`Enter KG (Max: ${currentBalance})`}
                required
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 outline-none transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700">
                KG
              </span>
            </div>
          </div>

          {/* Balance Preview Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Remaining Balance after Issue:</span>
            <span
              className={`font-mono font-bold text-sm ${
                remainingAfter === 0 ? 'text-slate-500' : 'text-emerald-700'
              }`}
            >
              {remainingAfter.toFixed(2)} KG {remainingAfter === 0 && '(Roll Closed)'}
            </span>
          </div>

          {/* Machine & Job Order */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Machine / Line</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
              >
                <option value="Corrugator Line 1">Corrugator Line 1</option>
                <option value="Corrugator Line 2">Corrugator Line 2</option>
                <option value="Sheet Cutter Machine">Sheet Cutter Machine</option>
                <option value="Rotary Slotter / Die Cutter">Rotary Slotter / Die</option>
                <option value="Manual Job">Manual / Sampling</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Job / Box Reference</label>
              <input
                type="text"
                value={jobOrderNo}
                onChange={(e) => setJobOrderNo(e.target.value)}
                placeholder="e.g. JO-4022 / 5-Ply Box"
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Remarks / Operator Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Fluting roll for 1200 boxes"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-theme-secondary px-4 py-2 rounded-xl text-xs text-slate-700 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-theme-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-heading font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Recording...' : 'Confirm Consumption'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
