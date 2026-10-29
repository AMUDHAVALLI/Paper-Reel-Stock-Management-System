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
      border: 'border-amber-200 hover:border-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      valueColor: 'text-amber-600',
    },
    emerald: {
      border: 'border-emerald-200 hover:border-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      valueColor: 'text-emerald-600',
    },
    blue: {
      border: 'border-blue-200 hover:border-blue-400',
      bgGlow: 'from-blue-500/10 to-transparent',
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      valueColor: 'text-blue-600',
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-400',
      bgGlow: 'from-purple-500/10 to-transparent',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      valueColor: 'text-purple-600',
    },
    rose: {
      border: 'border-rose-200 hover:border-rose-400',
      bgGlow: 'from-rose-500/10 to-transparent',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      valueColor: 'text-rose-600',
    },
  };

  const scheme = colorMap[colorScheme];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl theme-card bg-white border ${scheme.border} p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
    >
      <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br ${scheme.bgGlow} rounded-full blur-2xl pointer-events-none`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-heading">{title}</p>
          <h3 className={`mt-2 text-2xl font-black tracking-tight font-heading ${scheme.valueColor}`}>
            {value}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl border ${scheme.iconBg} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-1.5 text-xs">
          <span
            className={`font-bold ${
              trendPositive ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
