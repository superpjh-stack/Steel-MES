'use client';

import { useEffect, useState } from 'react';
import { Globe, Package, Leaf, Search, AlertCircle } from 'lucide-react';

interface OriginItem {
  id: string;
  code: string;
  name: string;
  spec: string | null;
  originCountry: string | null;
  allergenFlag: string | null;
  isOrganic: boolean;
  supplier: string | null;
  expiryDays: number | null;
  storageTemp: string | null;
}

export default function OriginPage() {
  const [items, setItems] = useState<OriginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/inventory/origin')
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.data); })
      .finally(() => setLoading(false));
  }, []);

  // Unique origin countries for filter dropdown
  const countries = Array.from(new Set(items.map((i) => i.originCountry).filter(Boolean))) as string[];

  const filtered = items.filter((i) => {
    const matchCountry = filter === 'all' || i.originCountry === filter;
    const matchSearch = !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      (i.supplier ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCountry && matchSearch;
  });

  const countByCountry = countries.reduce<Record<string, number>>((acc, c) => {
    acc[c] = items.filter((i) => i.originCountry === c).length;
    return acc;
  }, {});

  const allergenCount = items.filter((i) => i.allergenFlag).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Globe size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">원산지 관리</h1>
          <p className="text-sm text-slate-500">원료별 원산지, 알레르기 및 보관 정보 현황</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-600">총 원료 수</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{items.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600">원산지 국가 수</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{countries.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 flex items-center gap-1"><Leaf size={12} /> 유기농 원료</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{items.filter((i) => i.isOrganic).length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> 알레르기 원료</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{allergenCount}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="원료명, 코드, 공급업체 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">전체 ({items.length})</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c} ({countByCountry[c]})</option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['원료코드', '원료명', '원산지', '규격', '보관온도', '알레르기', '유기농', '공급업체'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400">
                      <Package size={32} className="mx-auto mb-2 opacity-30" />
                      <p>해당하는 원료가 없습니다.</p>
                    </td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                        {item.originCountry ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{item.spec ?? '-'}</td>
                    <td className="px-4 py-3 text-xs">
                      {item.storageTemp
                        ? <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{item.storageTemp}</span>
                        : <span className="text-slate-400">-</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {item.allergenFlag
                        ? <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{item.allergenFlag}</span>
                        : <span className="text-slate-400">없음</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {item.isOrganic
                        ? <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1 w-fit"><Leaf size={10} /> 유기농</span>
                        : <span className="text-slate-400">-</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{item.supplier ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
