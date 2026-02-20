'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Search, FileText, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type DocType = 'quotation' | 'contract' | 'po' | 'amendment' | 'other';
interface Doc {
  id: string; salesOrderId: string; docType: DocType;
  fileName: string; fileUrl: string; fileSize: number | null;
  notes: string | null; createdAt: string;
  salesOrder: { soNo: string; customer: { name: string } };
}
interface SalesOrder { id: string; soNo: string; customer: { name: string }; product: { name: string } }

const DOC_LABEL: Record<DocType, string> = {
  quotation: '견적서', contract: '계약서', po: '발주서', amendment: '변경계약', other: '기타',
};
const DOC_COLOR: Record<DocType, string> = {
  quotation: 'bg-blue-100 text-blue-700', contract: 'bg-green-100 text-green-700',
  po: 'bg-purple-100 text-purple-700', amendment: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

function fmtSize(bytes: number | null) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const emptyForm = () => ({ salesOrderId: '', docType: 'quotation' as DocType, fileName: '', fileUrl: '', fileSize: '', notes: '' });

export default function ContractsPage() {
  const [items,   setItems]   = useState<Doc[]>([]);
  const [orders,  setOrders]  = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [typeF,   setTypeF]   = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/sales/contracts').then(r => r.json()),
      fetch('/api/sales-orders?limit=200').then(r => r.json()),
    ]).then(([cRes, soRes]) => {
      setItems(cRes.data ?? []);
      setOrders(soRes.items ?? []);
    }).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const filtered = items.filter(i =>
    (!typeF || i.docType === typeF) &&
    (!q || i.fileName.includes(q) || i.salesOrder.soNo.includes(q) || i.salesOrder.customer.name.includes(q)),
  );

  async function handleSave() {
    setSaving(true); setError('');
    const res = await fetch('/api/sales/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        fileSize: form.fileSize ? parseInt(form.fileSize) : null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (!res.ok) { const e = await res.json(); setError(e.message ?? '저장 실패'); return; }
    setModal(false); setForm(emptyForm()); load();
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return;
    await fetch(`/api/sales/contracts?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">견적/계약문서첨부관리</h1>
          <p className="text-xs text-gray-500 mt-0.5">견적서·계약서 등 수주 관련 문서를 첨부·관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setForm(emptyForm()); setError(''); setModal(true); }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />첨부 등록
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-3">
        {(Object.keys(DOC_LABEL) as DocType[]).map(t => {
          const cnt = items.filter(i => i.docType === t).length;
          return (
            <div key={t} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{cnt}</p>
              <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${DOC_COLOR[t]}`}>{DOC_LABEL[t]}</span>
            </div>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="파일명·수주번호·고객사 검색"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">전체 유형</option>
          {(Object.keys(DOC_LABEL) as DocType[]).map(t => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">견적/계약문서 목록</caption>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['수주번호', '고객사', '문서 유형', '파일명', '파일 크기', '비고', '등록일', ''].map(h => (
                <th key={h} scope="col" className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">첨부된 문서가 없습니다.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">{d.salesOrder.soNo}</td>
                <td className="px-4 py-3 text-gray-900">{d.salesOrder.customer.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DOC_COLOR[d.docType]}`}>
                    {DOC_LABEL[d.docType]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[200px]">{d.fileName}</span>
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-500">{fmtSize(d.fileSize)}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{d.notes ?? '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(d.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(d.id)} aria-label="삭제"
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
      <Modal isOpen={modal} onClose={() => setModal(false)} title="문서 첨부 등록">
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label htmlFor="doc-so" className="block text-sm font-medium text-gray-700 mb-1">수주번호 <span className="sr-only">(필수)</span></label>
            <select id="doc-so" value={form.salesOrderId} onChange={e => setForm(f => ({ ...f, salesOrderId: e.target.value }))}
              required aria-required="true"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">수주 선택</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.soNo} — {o.customer.name} / {o.product.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="doc-type" className="block text-sm font-medium text-gray-700 mb-1">문서 유형 <span className="sr-only">(필수)</span></label>
              <select id="doc-type" value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value as DocType }))}
                required aria-required="true"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {(Object.keys(DOC_LABEL) as DocType[]).map(t => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="doc-size" className="block text-sm font-medium text-gray-700 mb-1">파일 크기 (bytes)</label>
              <input id="doc-size" type="number" value={form.fileSize} onChange={e => setForm(f => ({ ...f, fileSize: e.target.value }))}
                placeholder="예: 204800"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700 mb-1">파일명 <span className="sr-only">(필수)</span></label>
            <input id="doc-name" type="text" value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))}
              required aria-required="true" placeholder="예: 견적서_HMC_2026-02.pdf"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="doc-url" className="block text-sm font-medium text-gray-700 mb-1">파일 URL/경로 <span className="sr-only">(필수)</span></label>
            <input id="doc-url" type="text" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
              required aria-required="true" placeholder="예: /uploads/contracts/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="doc-notes" className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea id="doc-notes" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleSave} disabled={saving || !form.salesOrderId || !form.fileName || !form.fileUrl}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
