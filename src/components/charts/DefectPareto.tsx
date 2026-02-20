'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

export interface DefectBucket {
  code:  string;
  label: string;
  count: number;
}

interface Props {
  buckets:     DefectBucket[];
  totalOutput?: number;
  height?:     number;
}

export default function DefectPareto({ buckets, height = 300 }: Props) {
  if (buckets.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">불량 데이터가 없습니다.</p>;
  }

  const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
  let running = 0;
  const data = [...buckets]
    .sort((a, b) => b.count - a.count)
    .map((b) => {
      running += b.count;
      return {
        ...b,
        cumPct: totalCount > 0 ? Math.round((running / totalCount) * 100) : 0,
      };
    });

  return (
    <figure>
      <figcaption className="sr-only">불량 유형별 파레토 차트 — 건수 및 누적 비율</figcaption>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 40, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left"  label={{ value: '건수', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]}
                 label={{ value: '%', angle: 90, position: 'insideRight', offset: -5, fontSize: 11 }} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === '누적%' ? [`${value}%`, name] : [value, name]
            }
          />
          <Legend />
          <ReferenceLine yAxisId="right" y={80} stroke="#f59e0b" strokeDasharray="4 2"
                         label={{ value: '80%', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
          <Bar  yAxisId="left"  dataKey="count"  name="건수"  fill="#ef4444" radius={[2, 2, 0, 0]} />
          <Line yAxisId="right" dataKey="cumPct" name="누적%" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  );
}
