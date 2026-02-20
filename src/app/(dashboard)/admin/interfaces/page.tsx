'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

// ─── 상수 정의 ──────────────────────────────────────────────────────────────

const DEV_TYPES: { value: string; label: string }[] = [
  { value: 'barcode_reader', label: '바코드 리더' },
  { value: 'plc',            label: 'PLC' },
  { value: 'scale',          label: '계중기' },
  { value: 'rfid',           label: 'RFID 리더' },
  { value: 'sensor',         label: '센서' },
  { value: 'other',          label: '기타' },
];

const PROTOCOLS: { value: string; label: string }[] = [
  { value: 'tcp',     label: 'TCP/IP' },
  { value: 'serial',  label: '시리얼(COM)' },
  { value: 'modbus',  label: 'Modbus TCP' },
  { value: 'opc_ua',  label: 'OPC-UA' },
  { value: 'http',    label: 'HTTP/REST' },
  { value: 'mqtt',    label: 'MQTT' },
];

const DEV_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DEV_TYPES.map((t) => [t.value, t.label]),
);
const PROTOCOL_LABEL: Record<string, string> = Object.fromEntries(
  PROTOCOLS.map((p) => [p.value, p.label]),
);

const DEV_TYPE_COLOR: Record<string, string> = {
  barcode_reader: 'bg-blue-100 text-blue-700',
  plc:            'bg-purple-100 text-purple-700',
  scale:          'bg-orange-100 text-orange-700',
  rfid:           'bg-cyan-100 text-cyan-700',
  sensor:         'bg-green-100 text-green-700',
  other:          'bg-slate-100 text-slate-600',
};

// ─── 타입 ────────────────────────────────────────────────────────────────────

interface Device {
  id:          string;
  name:        string;
  devType:     string;
  protocol:    string;
  host:        string | null;
  port:        number | null;
  description: string | null;
  isActive:    boolean;
  createdAt:   string;
  updatedAt:   string;
}

interface FormState {
  name:        string;
  devType:     string;
  protocol:    string;
  host:        string;
  port:        string;
  description: string;
  isActive:    boolean;
}

const EMPTY_FORM: FormState = {
  name: '', devType: 'barcode_reader', protocol: 'tcp',
  host: '', port: '', description: '', isActive: true,
};

// ─── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function InterfacesPage() {
  const [devices,  setDevices]  = useState<Device[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Device | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/interfaces');
    if (res.ok) {
      const data = await res.json();
      setDevices(data.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(device: Device) {
    setEditTarget(device);
    setForm({
      name:        device.name,
      devType:     device.devType,
      protocol:    device.protocol,
      host:        device.host ?? '',
      port:        device.port != null ? String(device.port) : '',
      description: device.description ?? '',
      isActive:    device.isActive,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);

    const body = {
      name:        form.name.trim(),
      devType:     form.devType,
      protocol:    form.protocol,
      host:        form.host.trim() || null,
      port:        form.port ? parseInt(form.port, 10) : null,
      description: form.description.trim() || null,
      isActive:    form.isActive,
    };

    const url    = editTarget ? `/api/interfaces/${editTarget.id}` : '/api/interfaces';
    const method = editTarget ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setModalOpen(false);
      await fetchDevices();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/interfaces/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setDeleteTarget(null);
      await fetchDevices();
    }
  }

  // KPI 집계
  const total    = devices.length;
  const active   = devices.filter((d) => d.isActive).length;
  const inactive = devices.filter((d) => !d.isActive).length;

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">인터페이스 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">바코드, PLC, 계중기 등 외부 장치 연동 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDevices}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            새로고침
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus size={14} />
            장치 등록
          </button>
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 장치',  value: total,    color: 'border-blue-500',   textColor: 'text-slate-800' },
          { label: '활성',       value: active,   color: 'border-green-500',  textColor: 'text-green-700' },
          { label: '비활성',     value: inactive, color: 'border-slate-400',  textColor: 'text-slate-500' },
        ].map(({ label, value, color, textColor }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 p-5 border-l-4 ${color}`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${textColor}`}>{value}<span className="text-sm font-normal text-slate-500 ml-1">개</span></p>
          </div>
        ))}
      </div>

      {/* 장치 목록 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">인터페이스 장치 목록</caption>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">장치명</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">유형</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">프로토콜</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">주소</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">설명</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">상태</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-300" />
                  로딩 중...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-400">
                  <p className="mb-1">등록된 장치가 없습니다.</p>
                  <p className="text-xs text-slate-300">상단 "장치 등록" 버튼으로 추가하세요.</p>
                </td>
              </tr>
            ) : devices.map((device) => (
              <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{device.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${DEV_TYPE_COLOR[device.devType] ?? 'bg-slate-100 text-slate-600'}`}>
                    {DEV_TYPE_LABEL[device.devType] ?? device.devType}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-600 font-mono text-xs">
                  {PROTOCOL_LABEL[device.protocol] ?? device.protocol}
                </td>
                <td className="px-5 py-3 font-mono text-xs text-slate-600">
                  {device.host
                    ? device.port ? `${device.host}:${device.port}` : device.host
                    : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs max-w-[200px] truncate">
                  {device.description ?? <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3 text-center">
                  {device.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                      <Wifi size={11} />활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                      <WifiOff size={11} />비활성
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(device)}
                      aria-label={`${device.name} 수정`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(device)}
                      aria-label={`${device.name} 삭제`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 등록/수정 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">
                {editTarget ? '장치 수정' : '장치 등록'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="닫기"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 장치명 */}
              <div>
                <label htmlFor="if-name" className="block text-sm font-medium text-slate-700 mb-1">
                  장치명 <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(필수)</span>
                </label>
                <input
                  id="if-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="예: 1호기 바코드 리더"
                  required
                  aria-required="true"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 유형 + 프로토콜 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="if-devtype" className="block text-sm font-medium text-slate-700 mb-1">
                    장치 유형 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="if-devtype"
                    value={form.devType}
                    onChange={(e) => setForm((p) => ({ ...p, devType: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DEV_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="if-protocol" className="block text-sm font-medium text-slate-700 mb-1">
                    프로토콜 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="if-protocol"
                    value={form.protocol}
                    onChange={(e) => setForm((p) => ({ ...p, protocol: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PROTOCOLS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* IP/호스트 + 포트 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="if-host" className="block text-sm font-medium text-slate-700 mb-1">
                    IP / 호스트 / COM 포트
                  </label>
                  <input
                    id="if-host"
                    type="text"
                    value={form.host}
                    onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                    placeholder="예: 192.168.1.100 또는 COM3"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="if-port" className="block text-sm font-medium text-slate-700 mb-1">
                    포트 번호
                  </label>
                  <input
                    id="if-port"
                    type="number"
                    min={1}
                    max={65535}
                    value={form.port}
                    onChange={(e) => setForm((p) => ({ ...p, port: e.target.value }))}
                    placeholder="예: 502"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label htmlFor="if-desc" className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                <input
                  id="if-desc"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="장치 위치 또는 용도"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 활성 여부 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">활성 상태</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '저장 중…' : editTarget ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-2">장치 삭제</h2>
            <p className="text-sm text-slate-600 mb-5">
              <strong className="text-slate-800">{deleteTarget.name}</strong> 을(를) 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
