'use client';

import { useState } from 'react';
import useSWR from 'swr';
import SpcChart from '@/components/charts/SpcChart';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  characteristics: string[];
  workOrders:      { id: string; label: string }[];
}

export default function SpcPageClient({ characteristics, workOrders }: Props) {
  const [workOrderId,    setWorkOrderId]    = useState('');
  const [characteristic, setCharacteristic] = useState('');

  const query = workOrderId && characteristic
    ? `/api/spc/chart?workOrderId=${workOrderId}&characteristic=${encodeURIComponent(characteristic)}`
    : null;

  const { data, isLoading } = useSWR(query, fetcher);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="bg-white rounded-lg border p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">작업지시</label>
          <select
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">WO 선택</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>{wo.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">측정 특성</label>
          <select
            value={characteristic}
            onChange={(e) => setCharacteristic(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">특성 선택</option>
            {characteristics.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 차트 */}
      <div className="bg-white rounded-lg border p-4">
        {!query && (
          <p className="text-sm text-gray-400 py-8 text-center">WO와 측정 특성을 선택하세요.</p>
        )}
        {isLoading && (
          <p className="text-sm text-gray-400 py-8 text-center">로딩 중...</p>
        )}
        {data && !isLoading && (
          <SpcChart
            points={data.points}
            xbar={data.xbar}
            range={data.range}
            usl={data.usl}
            lsl={data.lsl}
            characteristic={data.characteristic}
          />
        )}
      </div>
    </div>
  );
}
