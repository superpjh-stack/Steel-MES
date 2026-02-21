'use client';

import { useEffect, useState } from 'react';
import { Calendar, AlertTriangle, Package, CheckCircle } from 'lucide-react';

interface ExpiryItem {
  id: string;
  material?: { code: string; name: string; unit: string };
  product?:  { code: string; name: string; unit: string };
  lotNo: string | null;
  qty: number;
  location: string | null;
  status: string;
  // 유통기한 (inventory에 없으면 lot 기반으로 계산)
  expiryDate?: string | null;
  daysLeft?: number;
}

function ExpiryBadge({ days }: { days?: number }) {
  if (days === undefined || days === null) return <span className="text-xs text-slate-400">-</span>;
  if (days < 0)   return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 font-bold">만료({Math.abs(days)}일 초과)</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{days}일 남음</span>;
  if (days <= 90) return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">{days}일 남음</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">{days}일 남음</span>;
}

export default function ExpiryPage() {
  const [items, setItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'ok'>('all');

  useEffect(() => {
    fetch('/api/inventory?type=expiry')
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    const d = i.daysLeft;
    if (filter === 'critical') return d !== undefined && d !== null && d <= 30;
    if (filter === 'warning')  return d !== undefined && d !== null && d > 30 && d <= 90;
    if (filter === 'ok')       return d !== undefined && d !== null && d > 90;
    return true;
  });

  const critical = items.filter((i) => i.daysLeft !== undefined && i.daysLeft !== null && i.daysLeft <= 30).length;
  const warning  = items.filter((i) => i.daysLeft !== undefined && i.daysLeft !== null && i.daysLeft > 30 && i.daysLeft <= 90).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Calendar size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">유통기한 관리</h1>
          <p className="text-sm text-slate-500">원료 및 완제품 유통기한 현황</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle size={12} /> 30일 이내 만료</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{critical}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600">90일 이내 (주의)</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{warning}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> 정상</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{items.length - critical - warning}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {[{ v: 'all', l: '전체' }, { v: 'critical', l: '30일 이내' }, { v: 'warning', l: '30~90일' }, { v: 'ok', l: '90일 초과' }].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v as typeof filter)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === f.v ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['구분', '코드', '품목/원료명', 'LOT NO', '재고수량', '위치', '유통기한'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>해당하는 재고가 없습니다.</p>
                  </td>
                </tr>
              ) : filtered.map((item) => {
                const ref = item.material ?? item.product;
                const type = item.material ? '원료' : '완제품';
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${item.material ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{ref?.code ?? '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{ref?.name ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.lotNo ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {item.qty.toLocaleString()} {ref?.unit ?? ''}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.location ?? '-'}</td>
                    <td className="px-4 py-3">
                      <ExpiryBadge days={item.daysLeft} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
