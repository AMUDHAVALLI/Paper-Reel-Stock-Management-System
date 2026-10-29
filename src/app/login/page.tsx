'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Crown,
  Sparkles,
  Factory,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';

export default function LoginPage() {
  const router = useRouter();
  const { setUserSession, triggerRefresh } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      setUserSession(data.user);
      triggerRefresh();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 space-y-3">
        {/* onpackaging.in Hero Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-pill-brand shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-[11px] font-black tracking-wider uppercase font-heading text-amber-800">
            MANUFACTURER OF CORRUGATED BOXES
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-[#d97706] flex items-center justify-center shadow-md shadow-amber-500/25 text-white font-black text-2xl font-heading">
            ON
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-heading leading-tight">
              OM NAMASIVAYAM
            </h1>
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest font-heading">
              PACKAGING • PUDUCHERRY
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Paper Reel Stock & Inventory Management ERP
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-5">
        {/* Main Login Card */}
        <div className="theme-card bg-white border border-slate-200 py-8 px-6 shadow-xl rounded-3xl sm:px-10">
          <div className="mb-6 pb-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 font-heading">
              <Crown className="w-4 h-4 text-amber-600" />
              Admin Sign In
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold font-mono">
              Admin Only
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-heading">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-heading">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 btn-theme-primary text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <span>{loading ? 'Verifying admin credentials...' : 'Sign In as Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Plant Specs Footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-4">
          <span className="flex items-center gap-1 font-medium">
            <Factory className="w-3.5 h-3.5 text-amber-600" />
            70–90 Tonnes/Month Capacity
          </span>
          <span>•</span>
          <span className="font-medium">80 HP Connected Power</span>
        </div>
      </div>
    </div>
  );
}
