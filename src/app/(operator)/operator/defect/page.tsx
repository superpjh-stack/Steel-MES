'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AlertBanner from '@/components/ui/AlertBanner';

const DEFECT_CODES = [
  { code: 'D001', name: '치수불량' },
  { code: 'D002', name: '외관불량' },
  { code: 'D003', name: '재료불량' },
  { code: 'D004', name: '기능불량' },
  { code: 'D005', name: '기타' },
];

export default function QuickDefectPage() {
  const router = useRouter();
  const [defectCode, setDefectCode] = useState('');
  const [qty, setQty]               = useState(1);
  const [disposition, setDisposition] = useState('rework');
  const [note, setNote]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const selectedDefect = DEFECT_CODES.find((d) => d.code === defectCode);

  const handleSubmit = async () => {
    if (!defectCode) { setError('불량 유형을 선택하세요.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defectCode,
          defectName: selectedDefect?.name ?? defectCode,
          qty,
          disposition,
          rootCause: note || undefined,
        }),
      });
      if (!res.ok) throw new Error('등록 실패');
      setSuccess(true);
      setTimeout(() => router.push('/operator'), 1500);
    } catch (e: any) {
      setError(e.message ?? '불량 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <p className="text-4xl">✅</p>
        <p className="text-white font-bold text-lg">불량이 등록되었습니다.</p>
        <p className="text-gray-400 text-sm">잠시 후 이동합니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold">불량 신속 보고</h2>

      {/* 불량 유형 선택 */}
      <div className="bg-gray-700 rounded-xl p-4">
        <label className="block text-sm text-gray-300 mb-2 font-medium">불량 유형 *</label>
        <div className="grid grid-cols-2 gap-2">
          {DEFECT_CODES.map((d) => (
            <button
              key={d.code}
              onClick={() => setDefectCode(d.code)}
              className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                defectCode === d.code
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* 수량 */}
      <div className="bg-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-gray-300 font-medium">불량 수량</label>
          <span className="text-3xl font-bold text-red-400">{qty} EA</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 5, 10].map((v) => (
            <button
              key={v}
              onClick={() => setQty((p) => p + v)}
              className="bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-xl font-bold transition-colors"
            >
              +{v}
            </button>
          ))}
        </div>
        <button onClick={() => setQty(1)} className="w-full mt-2 text-gray-400 text-xs underline">초기화</button>
      </div>

      {/* 처리방법 */}
      <div className="bg-gray-700 rounded-xl p-4">
        <label className="block text-sm text-gray-300 mb-2 font-medium">처리방법</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'rework',     label: '재작업' },
            { value: 'scrap',      label: '폐기' },
            { value: 'use_as_is',  label: '특채' },
            { value: 'return',     label: '반납' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDisposition(opt.value)}
              className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                disposition === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div className="bg-gray-700 rounded-xl p-4">
        <label className="block text-sm text-gray-300 mb-2">메모 (선택)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full bg-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 resize-none"
          placeholder="불량 발생 상황을 간단히 기입하세요"
        />
      </div>

      {error && <AlertBanner variant="error" message={error} onClose={() => setError('')} />}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xl font-bold py-5 rounded-xl transition-colors"
      >
        {submitting ? '등록 중...' : '불량 보고'}
      </button>
      <button onClick={() => router.back()} className="w-full text-gray-500 py-2 text-sm">취소</button>
    </div>
  );
}
