import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, Hash, Activity } from 'lucide-react';

interface MetricCardProps {
  label?: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({ label = 'Result', value, subtext, trend, className }: MetricCardProps) {
  return (
    <div className={cn(
      "bg-[#202222] border border-gray-800 rounded-xl p-5 flex items-center gap-4",
      "hover:border-[#20b8cd]/30 transition-colors group",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-[#20b8cd]/10 flex items-center justify-center text-[#20b8cd] group-hover:scale-110 transition-transform">
        {typeof value === 'number' ? <Hash size={20} /> : <Activity size={20} />}
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
          {label}
        </div>
        <div className="text-2xl font-bold text-white font-mono">
          {value}
        </div>
        {subtext && (
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            {trend === 'up' && <TrendingUp size={12} className="text-green-400" />}
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

