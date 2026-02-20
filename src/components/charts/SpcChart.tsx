'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface SpcPoint {
  subgroup: number;
  xbar: number;
  range: number;
}

interface ChartProps {
  points:  SpcPoint[];
  cl:      number;
  ucl:     number;
  lcl:     number;
  usl?:    number;
  lsl?:    number;
  type:    'xbar' | 'range';
  height?: number;
}

function SpcSubChart({ points, cl, ucl, lcl, usl, lsl, type, height = 200 }: ChartProps) {
  const dataKey = type === 'xbar' ? 'xbar' : 'range';
  const label   = type === 'xbar' ? 'X-bar' : 'R';

  const values = points.map((p) => p[dataKey]);
  const outOfControl = new Set(
    values.map((v, i) => (v > ucl || v < lcl ? i : -1)).filter((i) => i >= 0)
  );

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label} 관리도</p>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={points} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="subgroup" tick={{ fontSize: 10 }} label={{ value: '소그룹', position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
          <Tooltip formatter={(v: number) => [v.toFixed(4), label]} />
          <ReferenceLine y={cl}  stroke="#3b82f6" strokeDasharray="4 2" label={{ value: `CL=${cl.toFixed(3)}`, position: 'right', fontSize: 10, fill: '#3b82f6' }} />
          <ReferenceLine y={ucl} stroke="#ef4444" strokeDasharray="4 2" label={{ value: `UCL=${ucl.toFixed(3)}`, position: 'right', fontSize: 10, fill: '#ef4444' }} />
          <ReferenceLine y={lcl} stroke="#ef4444" strokeDasharray="4 2" label={{ value: `LCL=${lcl.toFixed(3)}`, position: 'right', fontSize: 10, fill: '#ef4444' }} />
          {usl != null && type === 'xbar' && (
            <ReferenceLine y={usl} stroke="#f59e0b" label={{ value: `USL=${usl}`, position: 'right', fontSize: 10, fill: '#92400e' }} />
          )}
          {lsl != null && type === 'xbar' && (
            <ReferenceLine y={lsl} stroke="#f59e0b" label={{ value: `LSL=${lsl}`, position: 'right', fontSize: 10, fill: '#92400e' }} />
          )}
          <Line
            dataKey={dataKey}
            stroke="#6366f1"
            strokeWidth={1.5}
            dot={(props: any) => {
              const isOoc = outOfControl.has(props.index);
              return (
                <circle
                  key={props.index}
                  cx={props.cx}
                  cy={props.cy}
                  r={isOoc ? 5 : 3}
                  fill={isOoc ? '#ef4444' : '#6366f1'}
                  stroke="none"
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  points:        SpcPoint[];
  xbar:          { cl: number; ucl: number; lcl: number };
  range:         { cl: number; ucl: number; lcl: number };
  usl?:          number;
  lsl?:          number;
  characteristic: string;
}

export default function SpcChart({ points, xbar, range, usl, lsl, characteristic }: Props) {
  if (points.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">측정 데이터가 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-600">특성: {characteristic}</p>
      <SpcSubChart points={points} cl={xbar.cl} ucl={xbar.ucl} lcl={xbar.lcl} usl={usl} lsl={lsl} type="xbar" />
      <SpcSubChart points={points} cl={range.cl} ucl={range.ucl} lcl={range.lcl} type="range" />
    </div>
  );
}
