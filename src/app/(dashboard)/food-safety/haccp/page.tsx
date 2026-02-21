'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Thermometer, AlertTriangle, CheckCircle } from 'lucide-react';

interface HaccpPlan {
  id: string;
  ccpNo: string;
  hazardType: string;
  hazardDesc: string;
  criticalLimit: string;
  monitoringFreq: string;
  correctiveAction: string;
  status: string;
  effectiveDate: string;
  processCode: string | null;
  _count?: { monitoringLogs: number };
}

const HAZARD_TYPE: Record<string, { label: string; color: string; icon: string }> = {
  biological: { label: '생물학적', color: 'bg-red-100 text-red-700',    icon: '🦠' },
  chemical:   { label: '화학적',   color: 'bg-amber-100 text-amber-700', icon: '⚗️' },
  physical:   { label: '물리적',   color: 'bg-blue-100 text-blue-700',   icon: '🔩' },
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  active:        { label: '운영중',    color: 'bg-green-100 text-green-700' },
  under_review:  { label: '검토중',    color: 'bg-amber-100 text-amber-700' },
  suspended:     { label: '일시중단',  color: 'bg-red-100 text-red-600' },
};

export default function HaccpPage() {
  const [plans, setPlans] = useState<HaccpPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterHazard, setFilterHazard] = useState('');

  useEffect(() => {
    fetch('/api/haccp')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPlans(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = plans.filter((p) => !filterHazard || p.hazardType === filterHazard);

  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.status === 'active').length,
    biological: plans.filter((p) => p.hazardType === 'biological').length,
    chemical: plans.filter((p) => p.hazardType === 'chemical').length,
    physical: plans.filter((p) => p.hazardType === 'physical').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">HACCP 계획관리</h1>
            <p className="text-sm text-slate-500">위해요소 중요관리점(CCP) 계획 등록 및 관리</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus size={16} /> CCP 등록
        </button>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">전체 CCP</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
          <p className="text-xs text-slate-400 mt-1">운영중 {stats.active}개</p>
        </div>
        <div className="bg-white border border-red-100 rounded-xl p-4">
          <p className="text-xs text-red-500">🦠 생물학적</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{stats.biological}</p>
        </div>
        <div className="bg-white border border-amber-100 rounded-xl p-4">
          <p className="text-xs text-amber-500">⚗️ 화학적</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.chemical}</p>
        </div>
        <div className="bg-white border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-500">🔩 물리적</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{stats.physical}</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {[{ value: '', label: '전체' }, { value: 'biological', label: '🦠 생물학적' }, { value: 'chemical', label: '⚗️ 화학적' }, { value: 'physical', label: '🔩 물리적' }].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterHazard(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filterHazard === f.value
                ? 'bg-green-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* CCP 목록 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p>등록된 CCP가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((plan) => {
            const hazard = HAZARD_TYPE[plan.hazardType] ?? { label: plan.hazardType, color: 'bg-slate-100 text-slate-600', icon: '⚠️' };
            const status = STATUS_INFO[plan.status] ?? { label: plan.status, color: 'bg-slate-100 text-slate-600' };
            return (
              <div key={plan.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-bold text-slate-800 text-lg">{plan.ccpNo}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${hazard.color}`}>
                        {hazard.icon} {hazard.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {plan.processCode && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                          {plan.processCode}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-medium mb-3">{plan.hazardDesc}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-red-500 mb-1 flex items-center gap-1">
                          <Thermometer size={12} /> 한계기준 (Critical Limit)
                        </p>
                        <p className="text-sm font-bold text-red-800">{plan.criticalLimit}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-500 mb-1">모니터링 주기</p>
                        <p className="text-sm font-medium text-blue-800">{plan.monitoringFreq}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
                          <AlertTriangle size={12} /> 개선조치
                        </p>
                        <p className="text-sm text-amber-800 leading-tight">{plan.correctiveAction}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">시행일</p>
                    <p className="text-sm font-medium text-slate-600">
                      {new Date(plan.effectiveDate).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
