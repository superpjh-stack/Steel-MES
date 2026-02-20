'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, User, FileText, CheckCircle2, AlertTriangle, BellOff } from 'lucide-react';

type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

interface WorkOrder {
  id:          string;
  woNo:        string;
  plannedQty:  number;
  producedQty: number;
  defectQty:   number;
  status:      WoStatus;
  dueDate:     string;
  notes:       string | null;
  product:     { name: string; code: string };
  createdBy:   { name: string };
}

const STATUS_LABEL: Record<WoStatus, string> = {
  draft:       '초안',
  issued:      '대기',
  in_progress: '가동중',
  completed:   '완료',
  cancelled:   '취소',
};

const STATUS_BADGE: Record<WoStatus, string> = {
  draft:       'bg-slate-600 text-slate-200',
  issued:      'bg-blue-500 text-white',
  in_progress: 'bg-green-500 text-white',
  completed:   'bg-slate-600 text-white',
  cancelled:   'bg-red-600 text-white',
};

const STATUS_RING: Record<WoStatus, string> = {
  draft:       '#94a3b8',
  issued:      '#60a5fa',
  in_progress: '#22c55e',
  completed:   '#64748b',
  cancelled:   '#ef4444',
};

const FILTER_OPTIONS = [
  { value: 'active',    label: '현재 작업지시 현황' },
  { value: 'all',       label: '전체 현황' },
  { value: 'completed', label: '완료 현황' },
];

/* ── SVG 도넛 진행률 차트 ─────────────────────────────────────────────── */
function DonutProgress({ pct, color }: { pct: number; color: string }) {
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - Math.min(pct, 100) / 100);

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90" aria-hidden>
      {/* 배경 트랙 */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
      {/* 진행 아크 */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={dash}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  );
}

/* ── POP 카드 ─────────────────────────────────────────────────────────── */
function PopCard({ wo }: { wo: WorkOrder }) {
  const goodQty   = wo.producedQty - wo.defectQty;
  const pct       = wo.plannedQty > 0
    ? Math.min(100, Math.round((wo.producedQty / wo.plannedQty) * 100))
    : 0;
  const ringColor = STATUS_RING[wo.status];
  const isOverdue = new Date(wo.dueDate) < new Date() && wo.status !== 'completed';
  const processLine = wo.notes ?? wo.product.name;

  return (
    <article className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 flex flex-col shadow-xl">

      {/* ── 헤더: 상태 · 공정명 · 작업자 ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/70">
        <span className={`px-3 py-0.5 rounded-full text-sm font-bold shrink-0 ${STATUS_BADGE[wo.status]}`}>
          {STATUS_LABEL[wo.status]}
        </span>
        <span className="text-slate-200 text-sm font-medium truncate flex-1">
          {processLine}
        </span>
        <span className="flex items-center gap-1.5 text-slate-400 text-sm shrink-0">
          <User size={13} aria-hidden />
          작업자: {wo.createdBy?.name ?? '-'}
        </span>
      </div>

      {/* ── 본문 ─────────────────────────────────────────────────────── */}
      <div className="flex gap-0 p-5 flex-1">

        {/* 왼쪽: 생산 진행 현황 */}
        <div className="flex flex-col items-center gap-2.5 pr-5 border-r border-slate-700 shrink-0 min-w-[152px]">
          <p className="text-slate-400 text-xs font-medium tracking-wide">생산 목표</p>
          <p className="text-white text-2xl font-bold leading-none">
            {wo.producedQty.toLocaleString()}
            <span className="text-slate-400 text-base font-normal"> / {wo.plannedQty.toLocaleString()}</span>
          </p>

          {/* 도넛 차트 */}
          <div
            className="relative flex items-center justify-center"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`달성률 ${pct}%`}
          >
            <DonutProgress pct={pct} color={ringColor} />
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-white font-bold text-2xl leading-none">{pct}%</span>
              <span className="text-slate-400 text-[10px] mt-0.5">달성률</span>
            </div>
          </div>

          {/* 양품 / 불량 */}
          <div className="flex gap-5 pt-1">
            <div className="text-center">
              <p className="text-green-400 text-xl font-bold leading-none">{goodQty.toLocaleString()}</p>
              <p className="text-slate-400 text-xs mt-1">양품</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 text-xl font-bold leading-none">{wo.defectQty.toLocaleString()}</p>
              <p className="text-slate-400 text-xs mt-1">불량</p>
            </div>
          </div>
        </div>

        {/* 오른쪽: 작업지시 정보 */}
        <div className="flex-1 pl-5 flex flex-col justify-between gap-3 min-w-0">
          <div>
            <p className="text-slate-400 text-xs mb-1 tracking-wide">작업 지시 번호</p>
            <p className="text-white text-xl font-bold font-mono truncate">{wo.woNo}</p>
            <p className="text-slate-100 font-semibold mt-2 leading-snug">{wo.product.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{wo.product.code}</p>

            {isOverdue ? (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                ⚠ 납기 초과 — {new Date(wo.dueDate).toLocaleDateString('ko-KR')}
              </p>
            ) : (
              <p className="text-slate-500 text-xs mt-2">
                납기: {new Date(wo.dueDate).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>

          <a
            href={`/production/work-orders/${wo.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors self-start"
          >
            <FileText size={14} aria-hidden />
            도면 / 표준서 확인
          </a>
        </div>
      </div>

      {/* ── 하단 액션 버튼 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 border-t border-slate-700">
        <a
          href={`/operator/${wo.id}/input`}
          className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
        >
          <CheckCircle2 size={16} aria-hidden />
          실적 등록
        </a>
        <a
          href="/operator/defect"
          className="flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors border-x border-slate-700"
        >
          <AlertTriangle size={16} aria-hidden />
          부적합 보고
        </a>
        <button
          type="button"
          onClick={() =>
            alert(`🚨 비상 정지 요청\n작업지시: ${wo.woNo}\n\n설비 담당자에게 즉시 연락하세요.`)
          }
          className="flex items-center justify-center gap-2 py-3.5 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
        >
          <BellOff size={16} aria-hidden />
          비상 정지 / 지원 요청
        </button>
      </div>
    </article>
  );
}

/* ── 메인 페이지 ──────────────────────────────────────────────────────── */
export default function PopPage() {
  const [orders,      setOrders]      = useState<WorkOrder[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('active');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      if (filter === 'active') {
        const [r1, r2] = await Promise.all([
          fetch('/api/work-orders?status=in_progress&limit=20'),
          fetch('/api/work-orders?status=issued&limit=20'),
        ]);
        const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
        const combined = [...(d1.items ?? []), ...(d2.items ?? [])];
        combined.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        setOrders(combined);
      } else {
        const params = new URLSearchParams({ limit: '50' });
        if (filter === 'completed') params.set('status', 'completed');
        const res  = await fetch(`/api/work-orders?${params}`);
        const data = res.ok ? await res.json() : { items: [] };
        setOrders(data.items ?? []);
      }
    } finally {
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // 30초 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchOrders, 30_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const inProgress = orders.filter((o) => o.status === 'in_progress').length;
  const issued     = orders.filter((o) => o.status === 'issued').length;
  const completed  = orders.filter((o) => o.status === 'completed').length;

  return (
    /* full-bleed dark 배경: PageTransition 의 p-3 lg:p-5 를 상쇄 후 재패딩 */
    <div className="-m-3 lg:-m-5 min-h-full bg-slate-900">
      <div className="p-4 lg:p-6 space-y-5">

        {/* ── 헤더 ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              POP · 작업지시 현황
            </h1>
            {lastUpdated && (
              <p className="text-xs text-slate-400 mt-0.5">
                최종 갱신: {lastUpdated.toLocaleTimeString('ko-KR')} · 30초마다 자동 갱신
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-slate-600 rounded-lg px-3 py-2 text-sm bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="작업지시 필터"
            >
              {FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              aria-label="새로고침"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} aria-hidden />
              새로고침
            </button>
          </div>
        </div>

        {/* ── 요약 뱃지 ───────────────────────────────────────────── */}
        {!loading && orders.length > 0 && (
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="text-slate-400">
              총 <strong className="text-slate-200">{orders.length}</strong>건
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="text-slate-400">가동중 <strong className="text-green-400">{inProgress}</strong>건</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span className="text-slate-400">대기 <strong className="text-blue-400">{issued}</strong>건</span>
            </span>
            {completed > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
                <span className="text-slate-400">완료 <strong className="text-slate-300">{completed}</strong>건</span>
              </span>
            )}
          </div>
        )}

        {/* ── 로딩 ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <RefreshCw size={22} className="animate-spin text-slate-500" aria-hidden />
            <span className="text-slate-400 text-sm">작업지시 불러오는 중...</span>
          </div>
        )}

        {/* ── 빈 상태 ──────────────────────────────────────────────── */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-24 text-slate-500 text-sm">
            해당하는 작업지시가 없습니다.
          </div>
        )}

        {/* ── 카드 그리드 ──────────────────────────────────────────── */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
            {orders.map((wo) => <PopCard key={wo.id} wo={wo} />)}
          </div>
        )}

      </div>
    </div>
  );
}
