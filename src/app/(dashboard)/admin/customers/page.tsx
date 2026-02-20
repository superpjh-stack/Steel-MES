'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Customer { id: string; code: string; name: string; contact: string | null; otdTarget: number; }

const empty = (): Omit<Customer, 'id'> => ({ code: '', name: '', contact: '', otdTarget: 98 });

export default function AdminCustomersPage() {
  const [items,   setItems]   = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | 'delete' | null>(null);
  const [target,  setTarget]  = useState<Customer | null>(null);
  const [form,    setForm]    = useState(empty());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/customers');
    setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(empty()); setError(''); setModal('create'); }
  function openEdit(c: Customer) { setTarget(c); setForm({ code: c.code, name: c.name, contact: c.contact ?? '', otdTarget: c.otdTarget }); setError(''); setModal('edit'); }
  function openDelete(c: Customer) { setTarget(c); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }

  async function handleSave() {
    setSaving(true); setError('');
    const url  = modal === 'edit' ? `/api/customers/${target!.id}` : '/api/customers';
    const method = modal === 'edit' ? 'PUT' : 'POST';
    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, otdTarget: Number(form.otdTarget) }) });
    if (!res.ok) { const d = await res.json(); setError(d.error?.formErrors?.[0] ?? '저장 실패'); setSaving(false); return; }
    await load(); close(); setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    await fetch(`/api/customers/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">고객사 관리</h2>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700">
          <Plus size={15} /> 고객사 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['코드', '고객사명', '연락처', 'OTD목표', '관리'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{c.code}</td>
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.contact ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-600">{c.otdTarget}%</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                    <button onClick={() => openDelete(c)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록 / 수정 모달 */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={close}
        title={modal === 'edit' ? '고객사 수정' : '고객사 등록'} size="sm">
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}
          <Field label="고객코드" required disabled={modal === 'edit'}
            value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="예: HMC" />
          <Field label="고객사명" required value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Field label="연락처" value={form.contact ?? ''} onChange={(v) => setForm((f) => ({ ...f, contact: v }))} placeholder="예: 구매팀" />
          <Field label="OTD 목표 (%)" type="number" value={String(form.otdTarget)} onChange={(v) => setForm((f) => ({ ...f, otdTarget: Number(v) }))} />
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal open={modal === 'delete'} onClose={close} title="고객사 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-4"><span className="font-semibold">{target?.name}</span>을(를) 삭제하시겠습니까?</p>
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
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
    </div>
  );
}
