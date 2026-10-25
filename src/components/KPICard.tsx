import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose';
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  colorScheme = 'amber',
}: KPICardProps) {
  const colorMap = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      bgGlow: 'from-amber-500/10 to-transparent',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      valueColor: 'text-amber-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/50',
      bgGlow: 'from-blue-500/10 to-transparent',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      valueColor: 'text-blue-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      bgGlow: 'from-purple-500/10 to-transparent',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      valueColor: 'text-purple-400',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/50',
      bgGlow: 'from-rose-500/10 to-transparent',
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      valueColor: 'text-rose-400',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#111726]/90 border ${scheme.border} p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
    >
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br ${scheme.bgGlow} rounded-full blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-[#1e293b]/60 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trendPositive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
