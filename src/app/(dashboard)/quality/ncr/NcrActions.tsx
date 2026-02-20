'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type NcrStatus = 'open' | 'under_review' | 'approved' | 'closed';

const NEXT: Record<NcrStatus, { next: NcrStatus; label: string }[]> = {
  open:         [{ next: 'under_review', label: '검토 시작' }],
  under_review: [{ next: 'approved',     label: '승인' }, { next: 'open', label: '반려' }],
  approved:     [{ next: 'closed',       label: '종결' }],
  closed:       [],
};

export default function NcrActions({ ncrId, currentStatus }: { ncrId: string; currentStatus: string }) {
  const router   = useRouter();
  const [loading, setLoading] = useState(false);
  const actions  = NEXT[currentStatus as NcrStatus] ?? [];

  if (actions.length === 0) return null;

  const handleAction = async (next: NcrStatus) => {
    setLoading(true);
    try {
      await fetch(`/api/ncr/${ncrId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      {actions.map(({ next, label }) => (
        <button
          key={next}
          onClick={() => handleAction(next)}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
