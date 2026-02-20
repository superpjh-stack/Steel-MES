'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/operator/BarcodeScanner';
import AlertBanner from '@/components/ui/AlertBanner';

interface Props {
  woId: string;
  currentStatus: string;
}

export default function WorkStartClient({ woId, currentStatus }: Props) {
  const router  = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [lotNo, setLotNo]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/work-orders/${woId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (!res.ok) throw new Error('상태 변경 실패');
      router.push(`/operator/${woId}/input`);
    } catch (e: any) {
      setError(e.message ?? '작업 시작에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 로트번호 스캔 */}
      <div className="bg-gray-700 rounded-xl p-4 space-y-3">
        <label className="block text-sm text-gray-300 font-medium">로트번호 스캔 (선택)</label>
        <div className="flex gap-2">
          <input
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            className="flex-1 bg-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500"
            placeholder="LOT-20260220-001"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2.5 rounded-lg text-sm"
          >
            📷 스캔
          </button>
        </div>
      </div>

      {error && <AlertBanner variant="error" message={error} onClose={() => setError('')} />}

      {currentStatus === 'issued' ? (
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-black text-xl font-bold py-5 rounded-xl transition-colors"
        >
          {loading ? '처리 중...' : '작업 시작'}
        </button>
      ) : (
        <button
          onClick={() => router.push(`/operator/${woId}/input`)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold py-5 rounded-xl transition-colors"
        >
          실적 입력으로 이동
        </button>
      )}

      <button onClick={() => router.back()} className="w-full text-gray-500 py-2 text-sm">
        취소
      </button>

      {showScanner && (
        <BarcodeScanner
          onScan={(v) => { setLotNo(v); setShowScanner(false); }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
