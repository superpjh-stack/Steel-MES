'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface ProductionBarData {
  label: string;
  planned: number;
  produced: number;
  defect?: number;
}

interface Props {
  data: ProductionBarData[];
  height?: number;
  showDefect?: boolean;
  targetRate?: number;
}

export default function ProductionBar({ data, height = 280, showDefect = true, targetRate }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => [
            value.toLocaleString(),
            name === 'planned' ? '계획' : name === 'produced' ? '실적' : '불량',
          ]}
        />
        <Legend
          formatter={(value) =>
            value === 'planned' ? '계획' : value === 'produced' ? '실적' : '불량'
          }
        />
        <Bar dataKey="planned" fill="#93c5fd" radius={[3, 3, 0, 0]} />
        <Bar dataKey="produced" fill="#34d399" radius={[3, 3, 0, 0]} />
        {showDefect && <Bar dataKey="defect" fill="#f87171" radius={[3, 3, 0, 0]} />}
        {targetRate != null && (
          <ReferenceLine
            y={targetRate}
            stroke="#f59e0b"
            strokeDasharray="4 2"
            label={{ value: `목표 ${targetRate}%`, position: 'right', fontSize: 11, fill: '#92400e' }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
