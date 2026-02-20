'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type EquipStatus = 'running' | 'stopped' | 'maintenance' | 'breakdown';

const NEXT: Record<EquipStatus, { next: EquipStatus; label: string; color: string }[]> = {
  running:     [{ next: 'stopped',     label: '정지',    color: 'bg-gray-500 hover:bg-gray-600' },
                { next: 'maintenance', label: '보전시작', color: 'bg-yellow-500 hover:bg-yellow-600 text-black' }],
  stopped:     [{ next: 'running',     label: '가동',    color: 'bg-green-600 hover:bg-green-700' },
                { next: 'maintenance', label: '보전시작', color: 'bg-yellow-500 hover:bg-yellow-600 text-black' }],
  maintenance: [{ next: 'running',     label: '보전완료', color: 'bg-green-600 hover:bg-green-700' },
                { next: 'breakdown',   label: '고장',    color: 'bg-red-600 hover:bg-red-700' }],
  breakdown:   [{ next: 'maintenance', label: '수리시작', color: 'bg-yellow-500 hover:bg-yellow-600 text-black' }],
};

export default function EquipStatusActions({
  equipmentId,
  currentStatus,
}: {
  equipmentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const actions = NEXT[currentStatus as EquipStatus] ?? [];

  const handleTransition = async (next: EquipStatus) => {
    setLoading(next);
    try {
      await fetch(`/api/equipment/${equipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      {actions.map(({ next, label, color }) => (
        <button
          key={next}
          onClick={() => handleTransition(next)}
          disabled={loading !== null}
          className={`${color} text-white text-sm font-medium px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors`}
        >
          {loading === next ? '처리 중...' : label}
        </button>
      ))}
    </div>
  );
}
