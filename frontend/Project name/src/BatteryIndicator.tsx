import React from 'react';

export const BatteryIndicator: React.FC<{ percentage: number; isSolarCharging?: boolean }> = ({
  percentage,
  isSolarCharging = true,
}) => {
  const isLow = percentage < 25;

  return (
    <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-700">
      <div className="relative w-7 h-4 border-2 border-slate-300 rounded-sm p-0.5">
        <div
          className={`h-full rounded-xs transition-all ${
            isLow ? 'bg-red-500' : percentage < 50 ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
          style={{ width: `${Math.max(10, Math.min(100, percentage))}%` }}
        />
        <div className="absolute -right-1.5 top-1 w-1 h-1.5 bg-slate-300 rounded-r-xs" />
      </div>
      <span className="text-xs font-bold tabular-nums">{percentage}%</span>
      {isSolarCharging && (
        <span className="text-xs text-amber-300 font-semibold flex items-center" title="Solar Charging Active">
          ☀️
        </span>
      )}
    </div>
  );
};
