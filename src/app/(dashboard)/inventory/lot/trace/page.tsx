'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Search, ArrowRight } from 'lucide-react';

export default function LotTraceLandingPage() {
  const router = useRouter();
  const [lotNo, setLotNo] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = lotNo.trim();
    if (!trimmed) return;
    router.push(`/inventory/lot/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <UtensilsCrossed size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">LOT 추적조회</h1>
          <p className="text-sm text-slate-500">LOT 번호로 원료 → 작업지시 → 출하까지 전 이력을 추적합니다</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="max-w-md">
        <label className="block text-sm font-medium text-slate-700 mb-2">LOT 번호 입력</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={lotNo}
              onChange={(e) => setLotNo(e.target.value)}
              placeholder="예: LOT-20260221-001"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={!lotNo.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            조회 <ArrowRight size={14} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">입고 시 부여된 LOT 번호를 입력하세요.</p>
      </form>
    </div>
  );
}
