'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Plus, Trash2 } from 'lucide-react';

interface InspectionOption {
  id: string;
  lotNo: string;
  type: string;
  workOrder: { woNo: string };
}
interface Ncr {
  id: string;
  ncrNo: string;
  status: string;
  disposition: string;
  approvedAt: string | null;
  createdAt: string;
  inspection: {
    lotNo: string;
    type: string;
    workOrder: { woNo: string };
  };
}

const STATUS_LABEL: Record<string, string> = {
  open: '접수', under_review: '검토중', approved: '승인', closed: '종결',
};
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  closed: 'bg-green-100 text-green-700',
};
type NcrStatus = 'open' | 'under_review' | 'approved' | 'closed';
const NEXT: Record<NcrStatus, { next: NcrStatus; label: string }[]> = {
  open:         [{ next: 'under_review', label: '검토 시작' }],
  under_review: [{ next: 'approved', label: '승인' }, { next: 'open', label: '반려' }],
  approved:     [{ next: 'closed', label: '종결' }],
  closed:       [],
};

const INSP_TYPE: Record<string, string> = { incoming: '수입', in_process: '공정', outgoing: '출하' };

const emptyForm = () => ({ inspectionId: '', disposition: '' });

export default function NcrPage() {
  const [items,        setItems]        = useState<Ncr[]>([]);
  const [inspections,  setInspections]  = useState<InspectionOption[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState<'create' | 'delete' | null>(null);
  const [target,       setTarget]       = useState<Ncr | null>(null);
  const [form,         setForm]         = useState(emptyForm());
  const [saving,       setSaving]       = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error,        setError]        = useState('');

  async function load() {
    setLoading(true);
    const [nRes, iRes] = await Promise.all([
      fetch('/api/ncr'),
      fetch('/api/inspections'),
    ]);
    const nData = await nRes.json();
    const iData = await iRes.json();
    setItems(nData.items ?? nData ?? []);
    setInspections(Array.isArray(iData) ? iData : (iData.items ?? []));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setForm(emptyForm()); setError(''); setModal('create'); }
  function openDelete(ncr: Ncr) { setTarget(ncr); setModal('delete'); }
  function close() { setModal(null); setTarget(null); }
  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCreate() {
    setSaving(true); setError('');
    const res = await fetch('/api/ncr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionId: form.inspectionId, disposition: form.disposition }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error?.formErrors?.[0] ?? d.message ?? '저장 실패');
      setSaving(false); return;
    }
    await load(); close(); setSaving(false);
  }

  async function handleDelete() {
    setSaving(true);
    await fetch(`/api/ncr/${target!.id}`, { method: 'DELETE' });
    await load(); close(); setSaving(false);
  }

  async function handleStatusAction(ncrId: string, next: NcrStatus) {
    setActionLoading(ncrId);
    await fetch(`/api/ncr/${ncrId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    await load();
    setActionLoading(null);
  }

  const openCount = items.filter((n) => ['open', 'under_review'].includes(n.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">부적합품 보고서 (NCR)</h2>
          {openCount > 0 && (
            <p className="text-sm text-red-600 mt-0.5">미처리 {openCount}건</p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
        >
          <Plus size={15} /> NCR 등록
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['NCR번호', 'WO번호', '로트번호', '검사유형', '처리방법', '상태', '승인일', '조치', '관리'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">불러오는 중...</td></tr>
            ) : items.map((ncr) => {
              const actions = NEXT[ncr.status as NcrStatus] ?? [];
              return (
                <tr key={ncr.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700">{ncr.ncrNo}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{ncr.inspection.workOrder.woNo}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{ncr.inspection.lotNo}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs">{INSP_TYPE[ncr.inspection.type]}</td>
                  <td className="px-4 py-2.5 text-gray-700">{ncr.disposition}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[ncr.status]}`}>
                      {STATUS_LABEL[ncr.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {ncr.approvedAt ? new Date(ncr.approvedAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {actions.map(({ next, label }) => (
                        <button
                          key={next}
                          onClick={() => handleStatusAction(ncr.id, next)}
                          disabled={actionLoading === ncr.id}
                          className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => openDelete(ncr)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" aria-label="삭제">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">NCR이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NCR 등록 모달 */}
      <Modal open={modal === 'create'} onClose={close} title="NCR 등록">
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">검사 기록 <span className="text-red-500">*</span></label>
            <select value={form.inspectionId} onChange={(e) => setF('inspectionId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">검사 기록 선택</option>
              {inspections.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.workOrder.woNo} / {ins.lotNo} ({INSP_TYPE[ins.type] ?? ins.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">처리방법 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.disposition}
              onChange={(e) => setF('disposition', e.target.value)}
              placeholder="예: 재작업 후 재검사"
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 */}
      <Modal open={modal === 'delete'} onClose={close} title="NCR 삭제" size="sm">
        <p className="text-gray-700 text-sm mb-1">
          <span className="font-semibold">{target?.ncrNo}</span>를 삭제하시겠습니까?
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
