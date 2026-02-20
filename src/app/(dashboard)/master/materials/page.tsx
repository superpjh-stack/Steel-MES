'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Material {
  id: string; code: string; name: string; unit: string;
  spec: string | null; supplier: string | null; safetyStock: number;
  inventory: { qty: number }[];
  _count: { lots: number };
}

const emptyForm = () => ({
  code: '', name: '', unit: 'KG', spec: '', supplier: '', safetyStock: '',
});

export default function MasterMaterialsPage() {
  const [items,   setItems]   = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | 'delete' | null>(null);
  const [target,  setTarget]  = useState<Material | null>(null);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/materials');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openEdit(m: Material) {
    setTarget(m);
    setForm({
      code: m.code, name: m.name, unit: m.unit,
      spec: m.spec ?? '', supplier: m.supplier ?? '',
      safetyStock: m.safetyStock != null ? String(m.safetyStock) : '',
    });
    setError(''); setModal('edit');
  }
  function openDelete(m: Material) { setTarget(m); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }

  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body = {
      name: form.name, unit: form.unit,
      ...(form.spec        ? { spec: form.spec }                     : {}),
      ...(form.supplier    ? { supplier: form.supplier }             : {}),
      ...(form.safetyStock ? { safetyStock: Number(form.safetyStock) } : {}),
    };
    let res: Response;
    if (modal === 'edit') {
      res = await fetch(`/api/materials/${target!.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
    } else {
      res = await fetch('/api/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.code, ...body }),
      });
    }
    if (!res.ok) { const d = await res.json(); setError(d.error?.formErrors?.[0] ?? d.error ?? '저장 실패'); setSaving(false); return; }
    await load(); close(); setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    await fetch(`/api/materials/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">원자재 관리</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
          <Plus size={15} /> 원자재 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['코드', '자재명', '단위', '규격', '공급업체', '안전재고', '현재고', '관리'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((m) => {
              const totalQty = m.inventory.reduce((s, i) => s + Number(i.qty), 0);
              const isShort  = m.safetyStock > 0 && totalQty <= m.safetyStock;
              return (
                <tr key={m.id} className={`hover:bg-gray-50 ${isShort ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{m.code}</td>
                  <td className="px-4 py-2.5 font-medium">{m.name}</td>
                  <td className="px-4 py-2.5 text-gray-500">{m.unit}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{m.spec ?? '-'}</td>
                  <td className="px-4 py-2.5 text-gray-500">{m.supplier ?? '-'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.safetyStock.toLocaleString()}</td>
                  <td className={`px-4 py-2.5 font-semibold ${isShort ? 'text-red-600' : 'text-gray-800'}`}>
                    {totalQty.toLocaleString()}
                    {isShort && <span className="ml-1 text-xs font-normal text-red-500">부족</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => openDelete(m)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">원자재가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={close}
        title={modal === 'edit' ? '원자재 수정' : '원자재 등록'}>
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="자재코드" required disabled={modal === 'edit'}
              value={form.code} onChange={(v) => setF('code', v)} placeholder="예: MAT-008" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">단위</label>
              <select value={form.unit} onChange={(e) => setF('unit', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['KG', 'EA', 'M', 'L', 'TON', 'BOX'].map((u) => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Field label="자재명" required value={form.name} onChange={(v) => setF('name', v)} placeholder="예: SPCC 냉연강판 t1.5" />
          <Field label="규격" value={form.spec} onChange={(v) => setF('spec', v)} placeholder="예: SPCC t1.5 x 1200W" />
          <Field label="공급업체" value={form.supplier} onChange={(v) => setF('supplier', v)} placeholder="예: (주)포스코" />
          <Field label="안전재고" type="number" value={form.safetyStock} onChange={(v) => setF('safetyStock', v)} placeholder="예: 1000" />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={close} title="원자재 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-4">
          <span className="font-semibold">{target?.name}</span>을(를) 삭제하시겠습니까?
        </p>
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
