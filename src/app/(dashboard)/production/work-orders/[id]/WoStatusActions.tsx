'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

const TRANSITIONS: Record<WoStatus, { next: WoStatus; label: string; color: string }[]> = {
  draft:       [{ next: 'issued',      label: '발행',    color: 'bg-blue-600 hover:bg-blue-700' }],
  issued:      [{ next: 'in_progress', label: '시작',    color: 'bg-yellow-500 hover:bg-yellow-600 text-black' },
                { next: 'cancelled',   label: '취소',    color: 'bg-gray-500 hover:bg-gray-600' }],
  in_progress: [{ next: 'completed',   label: '완료',    color: 'bg-green-600 hover:bg-green-700' },
                { next: 'issued',      label: '되돌리기', color: 'bg-gray-500 hover:bg-gray-600' }],
  completed:   [],
  cancelled:   [{ next: 'draft',       label: '재개',    color: 'bg-gray-500 hover:bg-gray-600' }],
};

interface Props {
  woId: string;
  currentStatus: WoStatus;
}

export default function WoStatusActions({ woId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<WoStatus | null>(null);

  const actions = TRANSITIONS[currentStatus] ?? [];
  if (actions.length === 0) return null;

  const handleTransition = async (next: WoStatus) => {
    setLoading(next);
    try {
      const res = await fetch(`/api/work-orders/${woId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      router.refresh();
    } catch {
      alert('상태 변경에 실패했습니다.');
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
          className={`${color} text-white text-sm font-medium px-4 py-1.5 rounded-md disabled:opacity-50 transition-colors`}
        >
          {loading === next ? '처리 중...' : label}
        </button>
      ))}
    </div>
  );
}
