'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';
import { Reel } from '@/lib/types';

export default function LabelsPrintStudioPage() {
  const { refreshKey } = useApp();
  const [reels, setReels] = useState<Reel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedGsm, setSelectedGsm] = useState('ALL');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/reels?status=IN_STOCK')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setReels(d.data);
          // Pre-select first 4 reels
          const initialSet = new Set<string>(d.data.slice(0, 4).map((r: Reel) => r.id));
          setSelectedIds(initialSet);
        }
      });
  }, [refreshKey]);

  // Generate QR codes for selected reels
  useEffect(() => {
    const selectedReels = reels.filter((r) => selectedIds.has(r.id));
    const newQrMap: Record<string, string> = {};

    Promise.all(
      selectedReels.map(async (r) => {
        const payload = JSON.stringify({
          reelNo: r.reelNo,
          mill: r.millName,
          size: r.sizeDesc,
          gsm: r.gsm,
          bf: r.bf,
          weight: r.weight,
          date: r.inwardDate,
        });
        const url = await QRCode.toDataURL(payload, {
          width: 250,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        newQrMap[r.id] = url;
      })
    ).then(() => {
      setQrMap(newQrMap);
    });
  }, [selectedIds, reels]);

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredReels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReels.map((r) => r.id)));
    }
  };

  const filteredReels = reels.filter((r) => {
    const matchesSearch =
      !search ||
      r.reelNo.toLowerCase().includes(search.toLowerCase()) ||
      r.millName.toLowerCase().includes(search.toLowerCase()) ||
      r.sizeDesc.toLowerCase().includes(search.toLowerCase());
    const matchesGsm = selectedGsm === 'ALL' || r.gsm.toString() === selectedGsm;
    return matchesSearch && matchesGsm;
  });

  const selectedReelsList = reels.filter((r) => selectedIds.has(r.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5 font-heading">
            <QrCode className="w-6 h-6 text-amber-600" />
            Barcode & QR Label Print Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Print adhesive roll tags with embedded specifications for warehouse inventory and rapid mobile scanning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono">
            {selectedIds.size} of {reels.length} selected
          </span>
          <button
            onClick={() => window.print()}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 px-5 py-2.5 btn-theme-primary text-xs font-bold disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print {selectedIds.size} Labels</span>
          </button>
        </div>
      </div>

      {/* Selector & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reel Selection List (5 cols) */}
        <div className="lg:col-span-5 theme-card bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[700px] no-print">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Select Rolls</h3>
            <button
              onClick={selectAll}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1.5"
            >
              {selectedIds.size === filteredReels.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>{selectedIds.size === filteredReels.length ? 'Deselect All' : 'Select All'}</span>
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Reel #, Size, Mill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredReels.map((reel) => {
              const isChecked = selectedIds.has(reel.id);
              return (
                <div
                  key={reel.id}
                  onClick={() => toggleSelect(reel.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isChecked
                      ? 'bg-amber-50/70 border-amber-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80 hover:border-amber-500/40 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-amber-600">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div>
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        Reel #{reel.reelNo}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {reel.sizeDesc} • {reel.gsm} GSM
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-amber-600 text-xs block">
                      {reel.weight} KG
                    </span>
                    <span className="text-[10px] text-slate-500">{reel.millName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Printable Label Sheets Preview (7 cols) */}
        <div className="lg:col-span-7 theme-card bg-white border border-slate-200 rounded-2xl p-6 shadow-xs overflow-y-auto max-h-[700px]">
          <div className="mb-4 no-print flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Label Sheet Preview ({selectedReelsList.length})</h3>
            <span className="text-xs text-slate-500 font-medium">Standard 4" × 3" Thermal Layout</span>
          </div>

          {selectedReelsList.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 no-print">
              <QrCode className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-xs">No reels selected. Choose rolls from the left panel to preview printable labels.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
              {selectedReelsList.map((reel) => (
                <div
                  key={reel.id}
                  className="bg-white text-black p-4 rounded-xl border-2 border-black flex flex-col items-center justify-between shadow-md print:shadow-none print:page-break-inside-avoid print:border-black"
                >
                  {/* Top Branding */}
                  <div className="w-full text-center border-b border-black pb-1 mb-2">
                    <h4 className="text-[11px] font-extrabold uppercase tracking-tight leading-tight">
                      OM NAMASIVAYAM PACKAGING
                    </h4>
                    <p className="text-[8px] font-bold tracking-widest text-slate-600">
                      PAPER REEL INVENTORY TAG
                    </p>
                  </div>

                  {/* QR Code */}
                  {qrMap[reel.id] ? (
                    <img
                      src={qrMap[reel.id]}
                      alt={reel.reelNo}
                      className="w-32 h-32 border border-black p-1 rounded-md"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-[10px]">
                      Generating QR...
                    </div>
                  )}

                  {/* Specs Matrix */}
                  <div className="w-full mt-2 pt-1 border-t border-black text-[10px] grid grid-cols-2 gap-x-2 gap-y-0.5 leading-tight">
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">Reel #</span>
                      <strong className="font-mono text-xs">{reel.reelNo}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">Mill</span>
                      <strong className="truncate block">{reel.millName}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">Deckle</span>
                      <strong>{reel.sizeDesc}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">GSM / BF</span>
                      <strong>{reel.gsm} GSM {reel.bf ? `• ${reel.bf} BF` : ''}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">Weight</span>
                      <strong className="font-mono text-xs">{reel.weight} KG</strong>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase text-slate-600 block">Inward Date</span>
                      <span>{reel.inwardDate}</span>
                    </div>
                  </div>

                  {reel.bayLocation && (
                    <div className="w-full mt-1.5 pt-1 border-t border-slate-300 text-center text-[9px] font-bold text-slate-700">
                      Bay Location: {reel.bayLocation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
