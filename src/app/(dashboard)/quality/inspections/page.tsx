'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface WorkOrder { id: string; woNo: string; }
interface Inspection {
  id: string;
  type: string;
  lotNo: string;
  sampleQty: number;
  passQty: number;
  failQty: number;
  result: string;
  inspectionDate: string;
  notes: string | null;
  workOrderId: string;
  workOrder: { woNo: string };
  inspector: { name: string };
}

const RESULT_COLOR: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  conditional: 'bg-yellow-100 text-yellow-700',
};
const RESULT_LABEL: Record<string, string> = { pass: '합격', fail: '불합격', conditional: '조건부' };
const TYPE_LABEL: Record<string, string> = { incoming: '수입검사', in_process: '공정검사', outgoing: '출하검사' };

const emptyForm = () => ({
  type: 'incoming', workOrderId: '', lotNo: '', sampleQty: '', passQty: '', failQty: '',
  result: 'pass', inspectionDate: new Date().toISOString().slice(0, 16), notes: '',
});

export default function InspectionsPage() {
  const [items,      setItems]      = useState<Inspection[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<'create' | 'edit' | 'delete' | null>(null);
  const [target,     setTarget]     = useState<Inspection | null>(null);
  const [form,       setForm]       = useState(emptyForm());
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  async function load() {
    setLoading(true);
    const [iRes, wRes] = await Promise.all([
      fetch('/api/inspections'),
      fetch('/api/work-orders?limit=100'),
    ]);
    const iData = await iRes.json();
    const wData = await wRes.json();
    setItems(Array.isArray(iData) ? iData : (iData.items ?? []));
    setWorkOrders(wData.items ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openEdit(ins: Inspection) {
    setTarget(ins);
    setForm({
      type: ins.type, workOrderId: ins.workOrderId, lotNo: ins.lotNo,
      sampleQty: String(ins.sampleQty), passQty: String(ins.passQty), failQty: String(ins.failQty),
      result: ins.result,
      inspectionDate: new Date(ins.inspectionDate).toISOString().slice(0, 16),
      notes: ins.notes ?? '',
    });
    setError(''); setModal('edit');
  }
  function openDelete(ins: Inspection) { setTarget(ins); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }
  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body = {
      type: form.type, workOrderId: form.workOrderId, lotNo: form.lotNo,
      sampleQty: Number(form.sampleQty), passQty: Number(form.passQty), failQty: Number(form.failQty),
      result: form.result,
      inspectionDate: new Date(form.inspectionDate).toISOString(),
      ...(form.notes ? { notes: form.notes } : {}),
    };
    const url    = modal === 'edit' ? `/api/inspections/${target!.id}` : '/api/inspections';
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
    await fetch(`/api/inspections/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">품질 검사 기록</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          <Plus size={15} /> 검사 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['검사유형', 'WO번호', '로트번호', '샘플', '합격', '불합격', '결과', '검사자', '일시', '관리'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((ins) => (
              <tr key={ins.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{TYPE_LABEL[ins.type]}</td>
                <td className="px-4 py-3 font-mono text-blue-600 text-xs">{ins.workOrder.woNo}</td>
                <td className="px-4 py-3 font-mono text-xs">{ins.lotNo}</td>
                <td className="px-4 py-3">{ins.sampleQty}</td>
                <td className="px-4 py-3 text-green-600">{ins.passQty}</td>
                <td className="px-4 py-3 text-red-500">{ins.failQty}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${RESULT_COLOR[ins.result]}`}>
                    {RESULT_LABEL[ins.result]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{ins.inspector.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(ins.inspectionDate).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(ins)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" aria-label="수정">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openDelete(ins)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="삭제">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-400">검사 기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록 / 수정 모달 */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={close}
        title={modal === 'edit' ? '검사 기록 수정' : '검사 등록'}>
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">검사유형 <span className="text-red-500">*</span></label>
              <select value={form.type} onChange={(e) => setF('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="incoming">수입검사</option>
                <option value="in_process">공정검사</option>
                <option value="outgoing">출하검사</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">작업지시 <span className="text-red-500">*</span></label>
              <select value={form.workOrderId} onChange={(e) => setF('workOrderId', e.target.value)}
                disabled={modal === 'edit'}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                <option value="">선택</option>
                {workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.woNo}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="로트번호" required value={form.lotNo} onChange={(v) => setF('lotNo', v)} placeholder="예: LOT-001" />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">검사결과 <span className="text-red-500">*</span></label>
              <select value={form.result} onChange={(e) => setF('result', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pass">합격</option>
                <option value="fail">불합격</option>
                <option value="conditional">조건부</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="샘플수량" required type="number" value={form.sampleQty} onChange={(v) => setF('sampleQty', v)} />
            <Field label="합격수량" required type="number" value={form.passQty} onChange={(v) => setF('passQty', v)} />
            <Field label="불합격수량" required type="number" value={form.failQty} onChange={(v) => setF('failQty', v)} />
          </div>

          <Field label="검사일시" required type="datetime-local" value={form.inspectionDate} onChange={(v) => setF('inspectionDate', v)} />
          <Field label="메모" value={form.notes} onChange={(v) => setF('notes', v)} placeholder="선택사항" />

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={modal === 'delete'} onClose={close} title="검사 기록 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-1">
          <span className="font-semibold">{target?.workOrder.woNo}</span> / <span className="font-semibold">{target?.lotNo}</span> 검사 기록을 삭제하시겠습니까?
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
