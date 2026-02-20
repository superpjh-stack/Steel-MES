'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QtyPad from './QtyPad';
import AlertBanner from '@/components/ui/AlertBanner';

interface Process {
  id: string;
  name: string;
  code: string;
}

interface Equipment {
  id: string;
  name: string;
  code: string;
}

interface Props {
  woId: string;
  woNo: string;
  productName: string;
  plannedQty: number;
  producedQty: number;
  processes: Process[];
  equipment: Equipment[];
}

export default function ProductionInput({
  woId,
  woNo,
  productName,
  plannedQty,
  producedQty,
  processes,
  equipment,
}: Props) {
  const router = useRouter();
  const [goodQty, setGoodQty]         = useState(0);
  const [defectQty, setDefectQty]     = useState(0);
  const [lotNo, setLotNo]             = useState('');
  const [processId, setProcessId]     = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const remaining = Math.max(0, plannedQty - producedQty);

  const handleSubmit = async () => {
    if (!lotNo.trim()) { setError('로트번호를 입력하세요.'); return; }
    if (!processId)    { setError('공정을 선택하세요.'); return; }
    if (!equipmentId)  { setError('설비를 선택하세요.'); return; }
    if (goodQty === 0) { setError('양품 수량을 입력하세요.'); return; }

    setError('');
    setSubmitting(true);
    try {
      const startTime = new Date(Date.now() - (goodQty + defectQty) * 60000).toISOString();
      const res = await fetch('/api/production-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: woId,
          processId,
          equipmentId,
          lotNo: lotNo.trim(),
          plannedQty: goodQty + defectQty,
          goodQty,
          defectQty,
          startTime,
          endTime: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? '저장 실패');
      }
      router.push('/operator');
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '실적 입력에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* WO 요약 */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="font-mono text-blue-300 text-xs">{woNo}</p>
        <p className="font-bold text-lg text-white mt-0.5">{productName}</p>
        <div className="flex gap-3 text-sm mt-2">
          <span className="text-gray-400">목표 <strong className="text-white">{plannedQty.toLocaleString()}</strong></span>
          <span className="text-gray-400">기생산 <strong className="text-green-400">{producedQty.toLocaleString()}</strong></span>
          <span className="text-gray-400">잔여 <strong className="text-yellow-400">{remaining.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* 입력 필드 */}
      <div className="bg-gray-700 rounded-xl p-4 space-y-3">
        <div>
          <label htmlFor="pi-lot-no" className="block text-xs text-gray-400 mb-1">
            로트번호 <span aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </label>
          <input
            id="pi-lot-no"
            value={lotNo}
            onChange={(e) => setLotNo(e.target.value)}
            required
            aria-required="true"
            className="w-full bg-gray-600 rounded-lg px-3 py-2.5 text-white text-base placeholder-gray-500"
            placeholder={`LOT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-001`}
          />
        </div>
        <div>
          <label htmlFor="pi-process" className="block text-xs text-gray-400 mb-1">
            공정 <span aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </label>
          <select
            id="pi-process"
            value={processId}
            onChange={(e) => setProcessId(e.target.value)}
            required
            aria-required="true"
            className="w-full bg-gray-600 rounded-lg px-3 py-2.5 text-white text-base"
          >
            <option value="">공정 선택</option>
            {processes.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pi-equipment" className="block text-xs text-gray-400 mb-1">
            설비 <span aria-hidden="true">*</span>
            <span className="sr-only">(필수)</span>
          </label>
          <select
            id="pi-equipment"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            required
            aria-required="true"
            className="w-full bg-gray-600 rounded-lg px-3 py-2.5 text-white text-base"
          >
            <option value="">설비 선택</option>
            {equipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.code} — {eq.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 수량 패드 */}
      <QtyPad label="양품 수량" value={goodQty} onChange={setGoodQty} accentColor="green" />
      <QtyPad label="불량 수량" value={defectQty} onChange={setDefectQty} accentColor="red" steps={[1, 2, 5, 10]} />

      {error && <AlertBanner variant="error" message={error} onClose={() => setError('')} />}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 text-white text-xl font-bold py-5 rounded-xl transition-colors"
      >
        {submitting ? '저장 중...' : '실적 저장'}
      </button>

      <button
        onClick={() => router.back()}
        className="w-full text-gray-500 py-2 text-sm"
      >
        취소
      </button>
    </div>
  );
}
