'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Customer { id: string; code: string; name: string; }
interface Product {
  id: string; code: string; name: string; category: string;
  unit: string; stdCycleSec: number | null; drawingNo: string | null;
  customerId: string;
  customer: { name: string; code: string };
  _count: { workOrders: number; inventory: number };
}

const CATEGORIES = [
  { value: 'brake',        label: '제동부품' },
  { value: 'steering',     label: '조향부품' },
  { value: 'fine_blanking',label: 'Fine Blanking' },
  { value: 'assembly',     label: '조립완제품' },
  { value: 'other',        label: '기타' },
];

const emptyForm = () => ({
  code: '', name: '', category: 'brake', unit: 'EA',
  customerId: '', drawingNo: '', stdCycleSec: '',
});

export default function AdminProductsPage() {
  const [items,     setItems]     = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<'create' | 'edit' | 'delete' | null>(null);
  const [target,    setTarget]    = useState<Product | null>(null);
  const [form,      setForm]      = useState(emptyForm());
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  async function load() {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      fetch('/api/products?limit=100'),
      fetch('/api/customers'),
    ]);
    const pData = await pRes.json();
    setItems(pData.items ?? []);
    setCustomers(await cRes.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openEdit(p: Product) {
    setTarget(p);
    setForm({
      code: p.code, name: p.name, category: p.category,
      unit: p.unit, customerId: p.customerId,
      drawingNo: p.drawingNo ?? '', stdCycleSec: p.stdCycleSec != null ? String(p.stdCycleSec) : '',
    });
    setError(''); setModal('edit');
  }
  function openDelete(p: Product) { setTarget(p); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }

  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body = {
      code:       form.code,
      name:       form.name,
      category:   form.category,
      unit:       form.unit,
      customerId: form.customerId,
      ...(form.drawingNo  ? { drawingNo: form.drawingNo } : {}),
      ...(form.stdCycleSec ? { stdCycleSec: Number(form.stdCycleSec) } : {}),
    };
    const url    = modal === 'edit' ? `/api/products/${target!.id}` : '/api/products';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error?.formErrors?.[0] ?? d.error ?? '저장 실패');
      setSaving(false); return;
    }
    await load(); close(); setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    await fetch(`/api/products/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  const catLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">품목 관리</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
          <Plus size={15} /> 품목 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['코드', '품목명', '분류', '고객사', '단위', '표준CT(초)', '작업지시', '관리'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.code}</td>
                <td className="px-4 py-2.5 font-medium">{p.name}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{catLabel(p.category)}</span>
                </td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">{p.customer?.name ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.unit}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.stdCycleSec ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-600">{p._count.workOrders}건</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                    <button onClick={() => openDelete(p)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">품목이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록 / 수정 모달 */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={close}
        title={modal === 'edit' ? '품목 수정' : '품목 등록'}>
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="품목코드" required disabled={modal === 'edit'}
              value={form.code} onChange={(v) => setF('code', v)} placeholder="예: BRK-001" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">단위</label>
              <select value={form.unit} onChange={(e) => setF('unit', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['EA', 'KG', 'M', 'SET', 'BOX'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <Field label="품목명" required value={form.name} onChange={(v) => setF('name', v)} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">분류 <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={(e) => setF('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">고객사 <span className="text-red-500">*</span></label>
              <select value={form.customerId} onChange={(e) => setF('customerId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택</option>
                {customers.map((c) => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="도면번호" value={form.drawingNo} onChange={(v) => setF('drawingNo', v)} placeholder="예: DWG-BRK-001-A" />
            <Field label="표준사이클(초)" type="number" value={form.stdCycleSec} onChange={(v) => setF('stdCycleSec', v)} placeholder="예: 45" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={modal === 'delete'} onClose={close} title="품목 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-1"><span className="font-semibold">{target?.name}</span>을(를) 삭제하시겠습니까?</p>
        {target?._count.workOrders ? (
          <p className="text-orange-600 text-xs mb-4">연결된 작업지시 {target._count.workOrders}건이 있습니다.</p>
        ) : <p className="text-gray-400 text-xs mb-4">이 작업은 되돌릴 수 없습니다.</p>}
        <div className="flex justify-end gap-2">
          <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
          <button onClick={handleDelete} disabled={saving} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50">
            {saving ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, required, disabled, placeholder, type = 'text' }:
  { label: string; value: string; onChange: (v: string) => void; required?: boolean; disabled?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
    </div>
  );
}
