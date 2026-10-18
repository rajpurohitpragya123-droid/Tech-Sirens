import React from 'react';
import { BatteryIndicator } from './BatteryIndicator';

export const SolarTelemetryCard: React.FC<{
  solarVoltage: number;
  batteryPercentage: number;
  soilMoisture: number;
  temperature: number;
}> = ({ solarVoltage, batteryPercentage, soilMoisture, temperature }) => {
  return (
    <div className="p-4 bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-bold text-sm">IoT Field Hub #1</span>
        </div>
        <BatteryIndicator percentage={batteryPercentage} isSolarCharging={solarVoltage > 4.5} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-slate-900/60 rounded-xl">
          <span className="text-slate-400 block mb-0.5">Soil Moisture</span>
          <span className="text-base font-bold text-emerald-400">{soilMoisture}%</span>
        </div>
        <div className="p-2.5 bg-slate-900/60 rounded-xl">
          <span className="text-slate-400 block mb-0.5">Temperature</span>
          <span className="text-base font-bold text-amber-300">{temperature} C</span>
        </div>
      </div>
    </div>
  );
};
