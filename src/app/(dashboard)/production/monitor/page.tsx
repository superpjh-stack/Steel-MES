'use client';

import { useEffect, useState } from 'react';

interface ProductionData {
  logs: { goodQty: number | null; defectQty: number | null; plannedQty: number | null };
  orders: Array<{ id: string; woNo: string; product: { name: string }; plannedQty: number; producedQty: number; priority: number }>;
  timestamp: string;
}

export default function ProductionMonitorPage() {
  const [data, setData] = useState<ProductionData | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events/production');
    es.onmessage = (e) => setData(JSON.parse(e.data));
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">실시간 데이터 연결 중...</p>
      </div>
    );
  }

  const planned = data.logs.plannedQty ?? 0;
  const produced = data.logs.goodQty ?? 0;
  const defects = data.logs.defectQty ?? 0;
  const rate = planned > 0 ? Math.round((produced / planned) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">공정 실시간 현황판</h2>
        <p className="text-xs text-gray-400">
          마지막 갱신: {new Date(data.timestamp).toLocaleTimeString('ko-KR')}
        </p>
      </div>

      {/* 금일 집계 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '금일 목표', value: planned, unit: 'EA', color: 'blue' },
          { label: '금일 실적', value: produced, unit: 'EA', color: 'green' },
          { label: '불량', value: defects, unit: 'EA', color: 'red' },
          { label: '달성률', value: rate, unit: '%', color: rate >= 90 ? 'green' : 'yellow' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className={`bg-white rounded-lg border p-4 border-l-4 ${
            color === 'blue' ? 'border-l-blue-500' :
            color === 'green' ? 'border-l-green-500' :
            color === 'red' ? 'border-l-red-500' : 'border-l-yellow-500'
          }`}>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{value.toLocaleString()}<span className="text-sm ml-1">{unit}</span></p>
          </div>
        ))}
      </div>

      {/* 진행 중인 작업지시 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-4">진행 중인 작업</h3>
        <div className="space-y-3">
          {data.orders.map((wo) => {
            const woRate = wo.plannedQty > 0 ? Math.round((wo.producedQty / wo.plannedQty) * 100) : 0;
            return (
              <div key={wo.id} className="flex items-center gap-4">
                <div className="w-32">
                  <p className="font-mono text-xs text-blue-600">{wo.woNo}</p>
                  <p className="text-sm font-medium truncate">{wo.product.name}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${woRate >= 90 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(woRate, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{woRate}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {wo.producedQty} / {wo.plannedQty} EA
                  </p>
                </div>
              </div>
            );
          })}
          {data.orders.length === 0 && (
            <p className="text-gray-400 text-sm">진행 중인 작업이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
