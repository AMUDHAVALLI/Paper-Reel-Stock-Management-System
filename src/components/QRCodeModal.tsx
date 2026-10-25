'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, QrCode as QrIcon } from 'lucide-react';
import { Reel } from '@/lib/types';

interface QRCodeModalProps {
  reel: Reel | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ reel, isOpen, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (reel) {
      // Encode comprehensive roll data into the QR code
      const qrPayload = JSON.stringify({
        reelNo: reel.reelNo,
        mill: reel.millName,
        size: reel.sizeDesc,
        gsm: reel.gsm,
        bf: reel.bf || '-',
        weight: reel.weight,
        balance: reel.balanceWeight,
        date: reel.inwardDate,
      });

      QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR:', err));
    }
  }, [reel]);

  if (!isOpen || !reel) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111726] border border-[#23314e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 no-print">
        {/* Header */}
        <div className="px-5 py-4 bg-[#162035] border-b border-[#23314e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-white text-sm">Reel Label & QR Sticker</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1f2d4a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 flex flex-col items-center">
          <div
            id="printable-label"
            className="w-full bg-white text-black p-5 rounded-xl border border-slate-300 shadow-md flex flex-col items-center select-text"
          >
            {/* Label Header */}
            <div className="w-full text-center border-b-2 border-black pb-2 mb-3">
              <h2 className="text-sm font-extrabold tracking-tight uppercase leading-none">
                OM NAMASIVAYAM PACKAGING
              </h2>
              <p className="text-[10px] font-semibold tracking-wider text-slate-700">
                PAPER REEL IDENTIFICATION TAG
              </p>
            </div>

            {/* QR Code image */}
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for Reel ${reel.reelNo}`}
                className="w-44 h-44 border border-black p-1 rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                Generating QR...
              </div>
            )}

            {/* Roll Details Grid */}
            <div className="w-full mt-3 pt-2 border-t border-black/30 grid grid-cols-2 gap-y-1 gap-x-2 text-xs">
              <div className="border-b border-slate-200 pb-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Reel Number</span>
                <span className="font-mono font-extrabold text-sm">{reel.reelNo}</span>
              </div>
              <div className="border-b border-slate-200 pb-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Paper Mill</span>
                <span className="font-bold text-xs truncate block">{reel.millName}</span>
              </div>
              <div className="border-b border-slate-200 pb-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Deckle / Size</span>
                <span className="font-extrabold text-xs">{reel.sizeDesc}</span>
              </div>
              <div className="border-b border-slate-200 pb-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-600 block">GSM / BF</span>
                <span className="font-extrabold text-xs">{reel.gsm} GSM {reel.bf ? `• ${reel.bf} BF` : ''}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Inward Wt</span>
                <span className="font-mono font-extrabold text-xs">{reel.weight} KG</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-600 block">Inward Date</span>
                <span className="font-mono text-xs">{reel.inwardDate}</span>
              </div>
            </div>

            {reel.bayLocation && (
              <div className="w-full mt-2 pt-1 border-t border-slate-300 text-center text-[10px] font-bold text-slate-700">
                Bay: {reel.bayLocation}
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-[#141b2c] border-t border-[#23314e] flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Print on standard 4" × 4" thermal sticker
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-[#23314e] text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
