'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, ChevronDown } from 'lucide-react';

interface Code {
  id:          string;
  groupCode:   string;
  groupName:   string;
  code:        string;
  codeName:    string;
  sortOrder:   number;
  isActive:    boolean;
  description: string | null;
}

interface FormState {
  groupCode:   string;
  groupName:   string;
  code:        string;
  codeName:    string;
  sortOrder:   string;
  isActive:    boolean;
  description: string;
}

const EMPTY_FORM: FormState = {
  groupCode: '', groupName: '', code: '', codeName: '',
  sortOrder: '0', isActive: true, description: '',
};

export default function CodesPage() {
  const [codes,       setCodes]       = useState<Code[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState<Code | null>(null);
  const [form,        setForm]        = useState<FormState>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Code | null>(null);
  // groupName 자동완성을 위한 기존 그룹 목록
  const [groupSuggestions, setGroupSuggestions] = useState<{ code: string; name: string }[]>([]);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/codes');
    if (res.ok) {
      const data = await res.json();
      const list: Code[] = data.data ?? [];
      setCodes(list);
      // 고유 그룹 추출
      const seen = new Map<string, string>();
      for (const c of list) {
        if (!seen.has(c.groupCode)) seen.set(c.groupCode, c.groupName);
      }
      setGroupSuggestions(Array.from(seen.entries()).map(([code, name]) => ({ code, name })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const groups = ['ALL', ...Array.from(new Set(codes.map((c) => c.groupCode)))];
  const filtered = groupFilter === 'ALL' ? codes : codes.filter((c) => c.groupCode === groupFilter);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(code: Code) {
    setEditTarget(code);
    setForm({
      groupCode:   code.groupCode,
      groupName:   code.groupName,
      code:        code.code,
      codeName:    code.codeName,
      sortOrder:   String(code.sortOrder),
      isActive:    code.isActive,
      description: code.description ?? '',
    });
    setModalOpen(true);
  }

  // groupCode 입력 시 groupName 자동 채우기
  function handleGroupCodeChange(val: string) {
    const match = groupSuggestions.find((g) => g.code === val);
    setForm((p) => ({ ...p, groupCode: val, groupName: match ? match.name : p.groupName }));
  }

  async function handleSave() {
    if (!form.groupCode.trim() || !form.code.trim() || !form.codeName.trim()) return;
    setSaving(true);
    const body = {
      groupCode:   form.groupCode.trim().toUpperCase(),
      groupName:   form.groupName.trim(),
      code:        form.code.trim().toUpperCase(),
      codeName:    form.codeName.trim(),
      sortOrder:   parseInt(form.sortOrder, 10) || 0,
      isActive:    form.isActive,
      description: form.description.trim() || null,
    };
    const url    = editTarget ? `/api/admin/codes/${editTarget.id}` : '/api/admin/codes';
    const method = editTarget ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { setModalOpen(false); await fetchCodes(); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/codes/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) { setDeleteTarget(null); await fetchCodes(); }
  }

  // 그룹별 코드 수
  const groupCountMap = codes.reduce<Record<string, number>>((acc, c) => {
    acc[c.groupCode] = (acc[c.groupCode] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">공통코드 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">시스템 전반에 공통으로 사용되는 코드 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCodes}
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
            코드 등록
          </button>
        </div>
      </div>

      {/* 그룹 필터 탭 */}
      <div className="flex items-center gap-2 flex-wrap">
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              groupFilter === g
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {g === 'ALL' ? `전체 (${codes.length})` : `${g} (${groupCountMap[g] ?? 0})`}
          </button>
        ))}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <caption className="sr-only">공통코드 목록</caption>
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">그룹코드</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">그룹명</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">코드</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">코드명</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">순서</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">설명</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">상태</th>
              <th scope="col" className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="py-16 text-center text-slate-400">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-slate-300" />로딩 중...
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-16 text-center text-slate-400">
                <p className="mb-1">등록된 코드가 없습니다.</p>
                <p className="text-xs text-slate-300">상단 "코드 등록" 버튼으로 추가하세요.</p>
              </td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-blue-600">{c.groupCode}</td>
                <td className="px-5 py-3 text-slate-600 text-xs">{c.groupName}</td>
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{c.code}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{c.codeName}</td>
                <td className="px-5 py-3 text-right text-slate-500 text-xs">{c.sortOrder}</td>
                <td className="px-5 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                  {c.description ?? <span className="text-slate-200">—</span>}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {c.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(c)} aria-label={`${c.codeName} 수정`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(c)} aria-label={`${c.codeName} 삭제`}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">{editTarget ? '코드 수정' : '코드 등록'}</h2>
              <button onClick={() => setModalOpen(false)} aria-label="닫기"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center">
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 그룹코드 + 그룹명 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cc-groupcode" className="block text-sm font-medium text-slate-700 mb-1">
                    그룹코드 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cc-groupcode" type="text" value={form.groupCode}
                    onChange={(e) => handleGroupCodeChange(e.target.value)}
                    placeholder="예: UNIT"
                    list="cc-group-list"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                  <datalist id="cc-group-list">
                    {groupSuggestions.map((g) => (
                      <option key={g.code} value={g.code}>{g.name}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="cc-groupname" className="block text-sm font-medium text-slate-700 mb-1">
                    그룹명 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cc-groupname" type="text" value={form.groupName}
                    onChange={(e) => setForm((p) => ({ ...p, groupName: e.target.value }))}
                    placeholder="예: 단위"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* 코드 + 코드명 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cc-code" className="block text-sm font-medium text-slate-700 mb-1">
                    코드 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cc-code" type="text" value={form.code}
                    onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                    placeholder="예: EA"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
                <div>
                  <label htmlFor="cc-codename" className="block text-sm font-medium text-slate-700 mb-1">
                    코드명 <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="cc-codename" type="text" value={form.codeName}
                    onChange={(e) => setForm((p) => ({ ...p, codeName: e.target.value }))}
                    placeholder="예: 개"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* 순서 + 설명 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cc-sort" className="block text-sm font-medium text-slate-700 mb-1">정렬순서</label>
                  <input
                    id="cc-sort" type="number" min={0} value={form.sortOrder}
                    onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="cc-desc" className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                  <input
                    id="cc-desc" type="text" value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="선택 입력"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* 활성 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700">활성 상태</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">취소</button>
              <button onClick={handleSave}
                disabled={saving || !form.groupCode.trim() || !form.code.trim() || !form.codeName.trim()}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
            <h2 className="text-base font-semibold text-slate-800 mb-2">코드 삭제</h2>
            <p className="text-sm text-slate-600 mb-5">
              <strong>[{deleteTarget.groupCode}] {deleteTarget.codeName}</strong> 을(를) 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">취소</button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
