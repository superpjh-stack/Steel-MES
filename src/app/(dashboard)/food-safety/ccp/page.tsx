'use client';

import { useEffect, useState } from 'react';
import { Thermometer, CheckCircle, XCircle, AlertTriangle, Plus } from 'lucide-react';

interface CcpLog {
  id: string;
  haccpPlanId: string;
  haccpPlan: { ccpNo: string; criticalLimit: string; hazardType: string };
  workOrderId: string | null;
  lotNo: string | null;
  monitoredAt: string;
  measuredValue: string;
  result: string;
  deviationNote: string | null;
  operatorId: string;
}

const RESULT_INFO: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pass:      { label: '합격',    color: 'text-green-600', Icon: CheckCircle },
  fail:      { label: '불합격',  color: 'text-red-600',   Icon: XCircle },
  deviation: { label: '이탈',    color: 'text-amber-600', Icon: AlertTriangle },
};

export default function CcpMonitoringPage() {
  const [logs, setLogs] = useState<CcpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState('');

  useEffect(() => {
    fetch('/api/haccp/monitoring')
      .then((r) => r.json())
      .then((d) => { if (d.success) setLogs(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter((l) => !filterResult || l.result === filterResult);

  const stats = {
    total: logs.length,
    pass: logs.filter((l) => l.result === 'pass').length,
    fail: logs.filter((l) => l.result === 'fail').length,
    deviation: logs.filter((l) => l.result === 'deviation').length,
  };
  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Thermometer size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">CCP 모니터링</h1>
            <p className="text-sm text-slate-500">중요관리점 한계기준 모니터링 기록</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus size={16} /> 모니터링 기록
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">합격률</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{passRate}%</p>
          <p className="text-xs text-slate-400 mt-1">전체 {stats.total}건</p>
        </div>
        <div className="bg-white border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-500">합격</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{stats.pass}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-500">이탈</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.deviation}</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-500">불합격</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{stats.fail}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {[{ value: '', label: '전체' }, { value: 'pass', label: '합격' }, { value: 'deviation', label: '이탈' }, { value: 'fail', label: '불합격' }].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterResult(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filterResult === f.value
                ? 'bg-green-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
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
                {['CCP번호', '한계기준', '측정값', '결과', 'LOT NO', '모니터링 일시', '이탈 조치'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Thermometer size={32} className="mx-auto mb-2 opacity-30" />
                    <p>모니터링 기록이 없습니다.</p>
                  </td>
                </tr>
              ) : filtered.map((log) => {
                const ri = RESULT_INFO[log.result] ?? { label: log.result, color: 'text-slate-600', Icon: AlertTriangle };
                const { Icon } = ri;
                return (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{log.haccpPlan.ccpNo}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{log.haccpPlan.criticalLimit}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{log.measuredValue}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 font-semibold ${ri.color}`}>
                        <Icon size={14} /> {ri.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.lotNo ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(log.monitoredAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                      {log.deviationNote ?? '-'}
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
