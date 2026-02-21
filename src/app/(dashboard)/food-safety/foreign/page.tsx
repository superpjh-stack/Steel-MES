'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Package } from 'lucide-react';

interface ForeignBodyReport {
  id: string;
  reportNo: string;
  detectedAt: string;
  lotNo: string | null;
  detectionPoint: string;
  foreignType: string;
  size: string | null;
  disposition: string;
  rootCause: string | null;
  affectedQty: number;
  status: string;
}

const FOREIGN_TYPE: Record<string, { label: string; icon: string }> = {
  metal:   { label: '금속',    icon: '🔩' },
  glass:   { label: '유리',    icon: '🪟' },
  rubber:  { label: '고무',    icon: '⚫' },
  plastic: { label: '플라스틱', icon: '🧴' },
  hair:    { label: '모발',    icon: '💇' },
  insect:  { label: '이물(곤충)', icon: '🐛' },
  other:   { label: '기타',    icon: '❓' },
};

const DISP_LABEL: Record<string, { label: string; color: string }> = {
  recall:     { label: '회수/폐기',  color: 'bg-red-100 text-red-700' },
  rework:     { label: '재작업',    color: 'bg-amber-100 text-amber-700' },
  scrap:      { label: '폐기',      color: 'bg-red-100 text-red-600' },
  use_as_is:  { label: '그대로 사용', color: 'bg-green-100 text-green-700' },
};

export default function ForeignBodyPage() {
  const [reports, setReports] = useState<ForeignBodyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/foreign-body')
      .then((r) => r.json())
      .then((d) => { if (d.success) setReports(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const openCount = reports.filter((r) => r.status === 'open').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">이물검출 관리</h1>
            <p className="text-sm text-slate-500">금속검출기, X-RAY, 육안 검출 이물 이력 관리</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus size={16} /> 이물 보고
        </button>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">전체 검출</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{reports.length}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-500">처리 중 (Open)</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{openCount}</p>
        </div>
        <div className="bg-white border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-500">처리 완료</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{reports.length - openCount}</p>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['보고번호', '검출일시', '이물 유형', '크기', '검출지점', 'LOT NO', '영향수량', '처리방법', '상태'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p>이물 검출 기록이 없습니다.</p>
                  </td>
                </tr>
              ) : reports.map((r) => {
                const ft = FOREIGN_TYPE[r.foreignType] ?? { label: r.foreignType, icon: '❓' };
                const disp = DISP_LABEL[r.disposition] ?? { label: r.disposition, color: 'bg-slate-100 text-slate-600' };
                return (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.reportNo}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(r.detectedAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {ft.icon} {ft.label}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.size ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{r.detectionPoint}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.lotNo ?? '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{r.affectedQty.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${disp.color}`}>
                        {disp.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        {r.status === 'open' ? '처리중' : '완료'}
                      </span>
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
