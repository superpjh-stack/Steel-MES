'use client';

import { useState } from 'react';
import useSWR from 'swr';
import SpcChart from '@/components/charts/SpcChart';
import Modal from '@/components/ui/Modal';
import { Plus } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  characteristics: string[];
  workOrders:      { id: string; label: string }[];
  processes:       { id: string; name: string }[];
}

const emptyForm = () => ({
  workOrderId: '', processId: '', characteristic: '', subgroupNo: '1',
  usl: '', lsl: '', nominal: '', measuredValue: '',
  measuredAt: new Date().toISOString().slice(0, 16),
});

export default function SpcPageClient({ characteristics, workOrders, processes }: Props) {
  const [workOrderId,    setWorkOrderId]    = useState('');
  const [characteristic, setCharacteristic] = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const query = workOrderId && characteristic
    ? `/api/spc/chart?workOrderId=${workOrderId}&characteristic=${encodeURIComponent(characteristic)}`
    : null;

  const { data, isLoading, mutate } = useSWR(query, fetcher);

  function openCreate() { setForm(emptyForm()); setError(''); setModal(true); }
  function close() { setModal(false); }
  function setF<K extends keyof ReturnType<typeof emptyForm>>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setError('');
    const body = {
      workOrderId: form.workOrderId,
      processId: form.processId,
      characteristic: form.characteristic,
      subgroupNo: Number(form.subgroupNo),
      usl: Number(form.usl),
      lsl: Number(form.lsl),
      nominal: Number(form.nominal),
      measuredValue: Number(form.measuredValue),
      measuredAt: new Date(form.measuredAt).toISOString(),
    };
    const res = await fetch('/api/spc/measurements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error?.formErrors?.[0] ?? d.error ?? '저장 실패');
      setSaving(false); return;
    }
    mutate();
    close();
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* 필터 + 등록 버튼 */}
      <div className="bg-white rounded-lg border p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">작업지시</label>
          <select
            value={workOrderId}
            onChange={(e) => setWorkOrderId(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">WO 선택</option>
            {workOrders.map((wo) => (
              <option key={wo.id} value={wo.id}>{wo.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-xs text-gray-500 mb-1">측정 특성</label>
          <select
            value={characteristic}
            onChange={(e) => setCharacteristic(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">특성 선택</option>
            {characteristics.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus size={15} /> 측정값 등록
        </button>
      </div>

      {/* 차트 */}
      <div className="bg-white rounded-lg border p-4">
        {!query && (
          <p className="text-sm text-gray-400 py-8 text-center">WO와 측정 특성을 선택하세요.</p>
        )}
        {isLoading && (
          <p className="text-sm text-gray-400 py-8 text-center">로딩 중...</p>
        )}
        {data && !isLoading && (
          <SpcChart
            points={data.points}
            xbar={data.xbar}
            range={data.range}
            usl={data.usl}
            lsl={data.lsl}
            characteristic={data.characteristic}
          />
        )}
      </div>

      {/* 측정값 등록 모달 */}
      <Modal open={modal} onClose={close} title="SPC 측정값 등록" size="lg">
        <div className="space-y-3">
          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">작업지시 <span className="text-red-500">*</span></label>
              <select value={form.workOrderId} onChange={(e) => setF('workOrderId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택</option>
                {workOrders.map((wo) => <option key={wo.id} value={wo.id}>{wo.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">공정 <span className="text-red-500">*</span></label>
              <select value={form.processId} onChange={(e) => setF('processId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">선택</option>
                {processes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="측정 특성" required value={form.characteristic} onChange={(v) => setF('characteristic', v)} placeholder="예: 두께(mm)" />
            <Field label="서브그룹번호" required type="number" value={form.subgroupNo} onChange={(v) => setF('subgroupNo', v)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="USL (상한)" required type="number" value={form.usl} onChange={(v) => setF('usl', v)} />
            <Field label="LSL (하한)" required type="number" value={form.lsl} onChange={(v) => setF('lsl', v)} />
            <Field label="공칭값" required type="number" value={form.nominal} onChange={(v) => setF('nominal', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="측정값" required type="number" value={form.measuredValue} onChange={(v) => setF('measuredValue', v)} />
            <Field label="측정일시" required type="datetime-local" value={form.measuredAt} onChange={(v) => setF('measuredAt', v)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={close} className="px-4 py-2 border rounded-md text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, required, placeholder, type = 'text' }:
  { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}
