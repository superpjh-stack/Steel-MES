'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface DefectLog {
  id: string;
  defectCode: string;
  defectName: string;
  qty: number;
  disposition: string;
  rootCause: string | null;
  correctiveAction: string | null;
  createdAt: string;
}

const DISP_LABEL: Record<string, string> = {
  rework: '재작업', scrap: '폐기', use_as_is: '특채', return: '반납',
};
const DISP_COLOR: Record<string, string> = {
  rework: 'text-yellow-600', scrap: 'text-red-600', use_as_is: 'text-blue-600', return: 'text-gray-600',
};

const emptyForm = () => ({
  defectCode: '', defectName: '', qty: '', disposition: 'rework', rootCause: '', correctiveAction: '',
});

export default function DefectsPage() {
  const [items,   setItems]   = useState<DefectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | 'delete' | null>(null);
  const [target,  setTarget]  = useState<DefectLog | null>(null);
  const [form,    setForm]    = useState(emptyForm());
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/defects?limit=100');
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openEdit(d: DefectLog) {
    setTarget(d);
    setForm({
      defectCode: d.defectCode, defectName: d.defectName, qty: String(d.qty),
      disposition: d.disposition, rootCause: d.rootCause ?? '', correctiveAction: d.correctiveAction ?? '',
    });
    setError(''); setModal('edit');
  }
  function openDelete(d: DefectLog) { setTarget(d); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }
  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body = {
      defectCode: form.defectCode, defectName: form.defectName, qty: Number(form.qty),
      disposition: form.disposition,
      ...(form.rootCause ? { rootCause: form.rootCause } : {}),
      ...(form.correctiveAction ? { correctiveAction: form.correctiveAction } : {}),
    };
    const url    = modal === 'edit' ? `/api/defects/${target!.id}` : '/api/defects';
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
    await fetch(`/api/defects/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  // 파레토 요약 (클라이언트 사이드 계산)
  const summary = items.reduce((acc, d) => {
    const key = `${d.defectCode}|${d.defectName}`;
    if (!acc[key]) acc[key] = { code: d.defectCode, name: d.defectName, qty: 0, count: 0 };
    acc[key].qty   += d.qty;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { code: string; name: string; qty: number; count: number }>);
  const summaryList = Object.values(summary).sort((a, b) => b.qty - a.qty);
  const totalQty = items.reduce((s, d) => s + d.qty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">불량 이력</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          <Plus size={15} /> 불량 등록
        </button>
      </div>

      {/* 파레토 요약 */}
      {!loading && summaryList.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">불량 유형별 집계</h3>
          <div className="space-y-2">
            {summaryList.map((s) => {
              const pct = totalQty > 0 ? Math.round((s.qty / totalQty) * 100) : 0;
              return (
                <div key={s.code} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-500 w-20">{s.code}</span>
                  <span className="text-sm text-gray-700 w-32 truncate">{s.name}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-red-600 w-16 text-right">{s.qty.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 이력 테이블 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">
            불량 이력 ({items.length}건 · 총 {totalQty.toLocaleString()}개)
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['불량코드', '불량명', '수량', '처리방법', '근본원인', '시정조치', '등록일', '관리'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{d.defectCode}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{d.defectName}</td>
                <td className="px-4 py-2.5 text-red-600 font-semibold">{d.qty.toLocaleString()}</td>
                <td className={`px-4 py-2.5 font-medium ${DISP_COLOR[d.disposition]}`}>
                  {DISP_LABEL[d.disposition]}
                </td>
                <td className="px-4 py-2.5 text-gray-600 text-xs max-w-32 truncate">{d.rootCause ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs max-w-32 truncate">{d.correctiveAction ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {new Date(d.createdAt).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" aria-label="수정">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openDelete(d)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="삭제">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">불량 데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록 / 수정 모달 */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={close}
        title={modal === 'edit' ? '불량 이력 수정' : '불량 등록'}>
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="불량코드" required value={form.defectCode} onChange={(v) => setF('defectCode', v)} placeholder="예: DC-001" />
            <Field label="불량명" required value={form.defectName} onChange={(v) => setF('defectName', v)} placeholder="예: 치수불량" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="수량" required type="number" value={form.qty} onChange={(v) => setF('qty', v)} />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">처리방법 <span className="text-red-500">*</span></label>
              <select value={form.disposition} onChange={(e) => setF('disposition', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="rework">재작업</option>
                <option value="scrap">폐기</option>
                <option value="use_as_is">특채</option>
                <option value="return">반납</option>
              </select>
            </div>
          </div>

          <Field label="근본원인" value={form.rootCause} onChange={(v) => setF('rootCause', v)} placeholder="선택사항" />
          <Field label="시정조치" value={form.correctiveAction} onChange={(v) => setF('correctiveAction', v)} placeholder="선택사항" />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={modal === 'delete'} onClose={close} title="불량 이력 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-1">
          <span className="font-semibold">[{target?.defectCode}] {target?.defectName}</span> 항목을 삭제하시겠습니까?
        </p>
        <p className="text-gray-400 text-xs mb-4">이 작업은 되돌릴 수 없습니다.</p>
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
