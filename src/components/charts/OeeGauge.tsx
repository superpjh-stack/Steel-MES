'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface OeeValues {
  availability: number;
  performance:  number;
  quality:      number;
  oee:          number;
}

interface Props extends OeeValues {
  size?: number;
}

function GaugeMini({ value, label, color }: { value: number; label: string; color: string }) {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 72, height: 72 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="70%" outerRadius="100%"
            startAngle={180} endAngle={0}
            data={data}
            barSize={10}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: '#e5e7eb' }} cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-gray-700">{value.toFixed(1)}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function OeeGauge({ availability, performance, quality, oee }: Props) {
  const oeeColor = oee >= 85 ? '#22c55e' : oee >= 60 ? '#f59e0b' : '#ef4444';
  const oeeData  = [{ name: 'OEE', value: oee, fill: oeeColor }];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 메인 OEE 게이지 */}
      <div className="relative" style={{ width: 140, height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%"
            innerRadius="65%" outerRadius="100%"
            startAngle={210} endAngle={-30}
            data={oeeData}
            barSize={16}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: '#e5e7eb' }} cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: oeeColor }}>{oee.toFixed(1)}</span>
          <span className="text-xs text-gray-400">OEE %</span>
        </div>
      </div>

      {/* 세부 지표 */}
      <div className="flex gap-4">
        <GaugeMini value={availability} label="가용률" color="#60a5fa" />
        <GaugeMini value={performance}  label="성능률" color="#a78bfa" />
        <GaugeMini value={quality}      label="품질률" color="#34d399" />
      </div>
    </div>
  );
}
