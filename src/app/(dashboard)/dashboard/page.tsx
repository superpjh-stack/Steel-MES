import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';
import KpiCard from '@/components/ui/KpiCard';
import Link from 'next/link';
import {
  Target, CheckCircle2, TrendingDown, Percent,
  Cpu, AlertTriangle, ClipboardList,
} from 'lucide-react';

const PM_DUE_THRESHOLD_DAYS = 7;

async function getDashboardData() {
  const today = new Date();
  const pmCutoff = new Date(Date.now() - PM_DUE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const [todayLogs, activeOrders, equipStatus, pmDue, recentNcr] = await Promise.all([
    prisma.productionLog.aggregate({
      where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } },
      _sum: { goodQty: true, defectQty: true, plannedQty: true },
    }),
    prisma.workOrder.findMany({
      where: { status: 'in_progress' },
      include: {
        product:  { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { priority: 'asc' },
      take: 6,
    }),
    prisma.equipment.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.equipment.findMany({
      where: { pmCycleDays: { not: null }, lastPmDate: { lt: pmCutoff } },
      select: { code: true, name: true, lastPmDate: true, pmCycleDays: true },
      take: 5,
    }),
    prisma.nonconformanceReport.findMany({
      where: { status: { in: ['open', 'in_review'] } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { ncrNo: true, disposition: true, status: true },
    }),
  ]);

  const planned  = Number(todayLogs._sum.plannedQty ?? 0);
  const produced = Number(todayLogs._sum.goodQty    ?? 0);
  const defects  = Number(todayLogs._sum.defectQty  ?? 0);
  const statusMap = Object.fromEntries(
    equipStatus.map((e: { status: string; _count: { status: number } }) => [e.status, e._count.status]),
  );

  return { planned, produced, defects, activeOrders, statusMap, pmDue, recentNcr };
}

const EQUIP_STATUS = [
  { key: 'running',     label: '가동',  dot: 'bg-green-500',  card: 'border-green-200 bg-green-50',  text: 'text-green-700' },
  { key: 'stopped',     label: '정지',  dot: 'bg-gray-400',   card: 'border-gray-200  bg-gray-50',   text: 'text-gray-600'  },
  { key: 'maintenance', label: '보전',  dot: 'bg-amber-500',  card: 'border-amber-200 bg-amber-50',  text: 'text-amber-700' },
  { key: 'breakdown',   label: '고장',  dot: 'bg-red-500',    card: 'border-red-200   bg-red-50',    text: 'text-red-700'   },
];

const NCR_STATUS_COLOR: Record<string, string> = {
  open:      'text-red-600 bg-red-50 border-red-200',
  in_review: 'text-orange-600 bg-orange-50 border-orange-200',
  closed:    'text-green-600 bg-green-50 border-green-200',
};

export default async function DashboardPage() {
  await auth();
  const { planned, produced, defects, activeOrders, statusMap, pmDue, recentNcr } =
    await getDashboardData();

  const achievementRate = planned > 0 ? Math.round((produced / planned) * 100) : 0;
  const defectRate      = produced + defects > 0
    ? ((defects / (produced + defects)) * 100).toFixed(1)
    : '0.0';

  const totalEquip = EQUIP_STATUS.reduce((s, e) => s + (statusMap[e.key] ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* 페이지 제목 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">공장 현황 대시보드</h2>
          <p className="text-xs text-gray-400 mt-0.5">실시간 생산 및 설비 현황</p>
        </div>
        <Link href="/production/work-orders/new"
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          <ClipboardList size={14} /> 작업지시 생성
        </Link>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="금일 생산 목표"
          value={planned.toLocaleString()}
          unit="EA"
          color="blue"
          icon={Target}
          sub="계획 수량"
        />
        <KpiCard
          label="금일 생산 실적"
          value={produced.toLocaleString()}
          unit="EA"
          color={achievementRate >= 90 ? 'green' : achievementRate >= 50 ? 'yellow' : 'red'}
          icon={CheckCircle2}
          progress={achievementRate}
        />
        <KpiCard
          label="목표 달성률"
          value={achievementRate}
          unit="%"
          color={achievementRate >= 90 ? 'green' : achievementRate >= 50 ? 'yellow' : 'red'}
          icon={Percent}
          trend={achievementRate >= 90 ? 'up' : achievementRate >= 50 ? 'flat' : 'down'}
          trendLabel={achievementRate >= 90 ? '목표 달성' : '목표 미달'}
        />
        <KpiCard
          label="불량률"
          value={defectRate}
          unit="%"
          color={parseFloat(defectRate) > 2 ? 'red' : parseFloat(defectRate) > 0.5 ? 'yellow' : 'green'}
          icon={TrendingDown}
          sub={`불량 ${defects.toLocaleString()} EA`}
        />
      </div>

      {/* 설비 현황 + NCR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 설비 현황 */}
        <div className="lg:col-span-2 bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Cpu size={16} className="text-blue-500" />
              설비 현황
            </h3>
            <Link href="/equipment" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {EQUIP_STATUS.map(({ key, label, dot, card, text }: { key: string; label: string; dot: string; card: string; text: string }) => {
              const cnt = statusMap[key] ?? 0;
              const pct = totalEquip > 0 ? Math.round((cnt / totalEquip) * 100) : 0;
              return (
                <div key={key} className={`rounded-lg border p-3 ${card}`}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className={`text-xs font-medium ${text}`}>{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${text}`}>{cnt}<span className="text-sm font-normal ml-1">대</span></p>
                  <p className="text-xs text-gray-400 mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>

          {/* PM 도래 알림 */}
          {pmDue.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-2">
                <AlertTriangle size={13} /> PM 도래 설비 ({pmDue.length}건)
              </p>
              <div className="space-y-1">
                {pmDue.map((e) => (
                  <div key={e.code} className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 font-mono">{e.code}</span>
                    <span className="text-amber-600">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 미결 NCR */}
        <div className="bg-white rounded-lg border shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              미결 NCR
            </h3>
            <Link href="/quality/ncr" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
          </div>
          {recentNcr.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">미결 NCR 없음</p>
          ) : (
            <div className="space-y-2">
              {recentNcr.map((n: { ncrNo: string; disposition: string; status: string }) => (
                <div key={n.ncrNo} className="rounded-md border p-2.5">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-mono text-gray-500">{n.ncrNo}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${NCR_STATUS_COLOR[n.status] ?? 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                      {n.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1 leading-snug line-clamp-2">{n.disposition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 진행 중인 작업지시 */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-500" />
            진행 중인 작업 ({activeOrders.length}건)
          </h3>
          <Link href="/production/work-orders" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
        </div>

        {activeOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">진행 중인 작업이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeOrders.map((wo: typeof activeOrders[0]) => {
              const rate = wo.plannedQty > 0
                ? Math.round((Number(wo.producedQty) / Number(wo.plannedQty)) * 100)
                : 0;
              const barColor = rate >= 90 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-amber-400';
              return (
                <Link key={wo.id} href={`/production/work-orders/${wo.id}`}
                  className="rounded-lg border p-3 hover:border-blue-300 hover:bg-blue-50/30 transition-colors group">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-xs text-blue-600 font-medium">{wo.woNo}</span>
                    <span className="text-xs text-gray-400 shrink-0">{rate}%</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-tight mb-0.5 truncate">{wo.product.name}</p>
                  <p className="text-xs text-gray-400 mb-2">{wo.customer.name}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(rate, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                    <span>{Number(wo.producedQty).toLocaleString()} EA 생산</span>
                    <span>목표 {Number(wo.plannedQty).toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
