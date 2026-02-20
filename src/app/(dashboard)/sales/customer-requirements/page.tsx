'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Search, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type Category = 'viscosity' | 'pressure' | 'vacuum' | 'corrosion' | 'temperature' | 'other';
interface Req {
  id: string; salesOrderId: string; category: Category;
  item: string; value: string; unit: string | null; notes: string | null;
  createdAt: string;
  salesOrder: { soNo: string; customer: { name: string } };
}
interface SalesOrder { id: string; soNo: string; customer: { name: string }; product: { name: string } }

const CAT_LABEL: Record<Category, string> = {
  viscosity: '점도', pressure: '압력', vacuum: '진공도',
  corrosion: '부식성', temperature: '온도', other: '기타',
};
const CAT_COLOR: Record<Category, string> = {
  viscosity: 'bg-blue-100 text-blue-700', pressure: 'bg-orange-100 text-orange-700',
  vacuum: 'bg-purple-100 text-purple-700', corrosion: 'bg-red-100 text-red-700',
  temperature: 'bg-yellow-100 text-yellow-700', other: 'bg-gray-100 text-gray-600',
};

const emptyForm = () => ({ salesOrderId: '', category: 'pressure' as Category, item: '', value: '', unit: '', notes: '' });

export default function CustomerRequirementsPage() {
  const [items,   setItems]   = useState<Req[]>([]);
  const [orders,  setOrders]  = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [catF,    setCatF]    = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/sales/requirements').then(r => r.json()),
      fetch('/api/sales-orders?limit=200').then(r => r.json()),
    ]).then(([rRes, soRes]) => {
      setItems(rRes.data ?? []);
      setOrders(soRes.items ?? []);
    }).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = items.filter(i =>
    (!catF || i.category === catF) &&
    (!q || i.item.includes(q) || i.salesOrder.soNo.includes(q) || i.salesOrder.customer.name.includes(q)),
  );

  async function handleSave() {
    setSaving(true); setError('');
    const res = await fetch('/api/sales/requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, unit: form.unit || null, notes: form.notes || null }),
    });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); setError(e.message ?? '저장 실패'); return; }
    setModal(false); setForm(emptyForm()); load();
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/sales/requirements?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">고객요구사항관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">점도·압력·진공·부식성 등 고객 공정 조건을 기록합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setForm(emptyForm()); setError(''); setModal(true); }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />등록
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="수주번호·고객사·항목 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={catF} onChange={e => setCatF(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 유형</option>
          {(Object.keys(CAT_LABEL) as Category[]).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">고객요구사항 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['수주번호', '고객사', '유형', '요구 항목', '요구 값', '단위', '비고', '등록일', ''].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">등록된 요구사항이 없습니다.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{r.salesOrder.soNo}</td>
                <td className="px-4 py-3 text-gray-900">{r.salesOrder.customer.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLOR[r.category]}`}>
                    {CAT_LABEL[r.category]}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{r.item}</td>
                <td className="px-4 py-3 text-gray-700">{r.value}</td>
                <td className="px-4 py-3 text-gray-500">{r.unit ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{r.notes ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r.id)} aria-label="삭제"
                    className="text-gray-400 hover:text-red-500 p-1 rounded min-w-[44px] min-h-[44px] flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록 모달 */}
      <Modal open={modal} onClose={() => setModal(false)} title="고객요구사항 등록">
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label htmlFor="req-so" className="block text-sm font-medium text-gray-700 mb-1">
              수주번호 <span className="sr-only">(필수)</span>
            </label>
            <select id="req-so" value={form.salesOrderId} onChange={e => setForm(f => ({ ...f, salesOrderId: e.target.value }))}
              required aria-required="true"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">수주 선택</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.soNo} — {o.customer.name} / {o.product.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="req-cat" className="block text-sm font-medium text-gray-700 mb-1">유형 <span className="sr-only">(필수)</span></label>
              <select id="req-cat" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                required aria-required="true"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.keys(CAT_LABEL) as Category[]).map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="req-unit" className="block text-sm font-medium text-gray-700 mb-1">단위</label>
              <input id="req-unit" type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="예: bar, ℃, mPa·s"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="req-item" className="block text-sm font-medium text-gray-700 mb-1">요구 항목 <span className="sr-only">(필수)</span></label>
            <input id="req-item" type="text" value={form.item} onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
              required aria-required="true" placeholder="예: 설계압력, 운전온도"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="req-value" className="block text-sm font-medium text-gray-700 mb-1">요구 값 <span className="sr-only">(필수)</span></label>
            <input id="req-value" type="text" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              required aria-required="true" placeholder="예: 10, ≤ 0.1, SUS316L"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="req-notes" className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea id="req-notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleSave} disabled={saving || !form.salesOrderId || !form.item || !form.value}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
