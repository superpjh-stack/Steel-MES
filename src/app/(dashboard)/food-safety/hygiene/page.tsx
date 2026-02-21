'use client';

import { useEffect, useState } from 'react';
import { Microscope, Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface HygieneCheck {
  id: string;
  checkDate: string;
  shift: string;
  area: string;
  result: string;
  failItems: string | null;
  correctiveAction: string | null;
  notes: string | null;
}

const AREA_LABEL: Record<string, string> = {
  production: '생산구역',
  storage: '보관창고',
  restroom: '화장실/탈의실',
  equipment: '설비/기기',
  personnel: '종사자 위생',
};

const RESULT_INFO: Record<string, { label: string; color: string }> = {
  pass:             { label: '합격',        color: 'bg-green-100 text-green-700' },
  fail:             { label: '불합격',      color: 'bg-red-100 text-red-600' },
  conditional_pass: { label: '조건부합격',  color: 'bg-amber-100 text-amber-700' },
};

export default function HygienePage() {
  const [checks, setChecks] = useState<HygieneCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState('');

  useEffect(() => {
    fetch('/api/hygiene')
      .then((r) => r.json())
      .then((d) => { if (d.success) setChecks(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = checks.filter((c) => !filterArea || c.area === filterArea);

  const stats = {
    total: checks.length,
    pass: checks.filter((c) => c.result === 'pass').length,
    fail: checks.filter((c) => c.result === 'fail').length,
    cond: checks.filter((c) => c.result === 'conditional_pass').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Microscope size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">위생점검 관리</h1>
            <p className="text-sm text-slate-500">생산구역, 설비, 종사자 위생 점검 기록</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus size={16} /> 위생점검 등록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">이번달 점검</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-500">합격</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.pass}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-500">조건부합격</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.cond}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-500">불합격</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{stats.fail}</p>
        </div>
      </div>

      {/* 구역 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterArea('')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!filterArea ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          전체
        </button>
        {Object.entries(AREA_LABEL).map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilterArea(val)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterArea === val ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['점검일시', '교대', '점검구역', '결과', '불합격 항목', '개선조치'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    <Microscope size={32} className="mx-auto mb-2 opacity-30" />
                    <p>위생점검 기록이 없습니다.</p>
                  </td>
                </tr>
              ) : filtered.map((c) => {
                const res = RESULT_INFO[c.result] ?? { label: c.result, color: 'bg-slate-100 text-slate-600' };
                return (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(c.checkDate).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.shift}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {AREA_LABEL[c.area] ?? c.area}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${res.color}`}>
                        {res.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">
                      {c.failItems ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {c.correctiveAction ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
