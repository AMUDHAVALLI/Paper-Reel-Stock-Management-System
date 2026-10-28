'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { useApp } from '@/components/AppShell';

export default function LoginPage() {
  const router = useRouter();
  const { setUserSession, triggerRefresh } = useApp();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const userToSubmit = customUser || username;
    const passToSubmit = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToSubmit,
          password: passToSubmit,
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

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  };

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center shadow-xl shadow-amber-500/25 text-white font-extrabold text-2xl mb-4 border border-amber-400/30">
          ON
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
          OM NAMASIVAYAM PACKAGING
        </h1>
        <p className="mt-1 text-xs text-amber-400 font-semibold tracking-wider uppercase">
          Paper Reel Stock Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
        {/* Main Login Card */}
        <div className="bg-[#101625] border border-[#22314e] py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <div className="mb-6 pb-4 border-b border-[#1e293b] flex items-center justify-between">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Admin Sign In
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Admin Only
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
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
                  className="w-full bg-[#162035] border border-[#243352] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <span>{loading ? 'Verifying admin credentials...' : 'Sign In as Admin'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick 1-Click Admin Login (Other roles hidden) */}
          <div className="mt-6 pt-5 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="w-full p-3 rounded-xl bg-[#162035] border border-[#243352] hover:border-amber-500/60 hover:bg-[#1c2944] flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-2.5 font-bold text-amber-400">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-white group-hover:text-amber-400 transition-colors">
                    1-Click Admin Quick Sign In
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
                </div>
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                Full Access
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
