import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

function KpiCard({ label, value, unit, sub, color }: {
  label: string; value: string | number; unit?: string; sub?: string; color: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 border-l-4 ${color}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">
        {value}<span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default async function MonitoringProductivityPage() {
  await auth();

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // 월초

  const [allWo, monthWo, logs] = await Promise.all([
    prisma.workOrder.findMany({
      where: { status: { in: ['in_progress', 'completed', 'issued'] } },
      select: { status: true, plannedQty: true, producedQty: true, defectQty: true, dueDate: true },
    }),
    prisma.workOrder.findMany({
      where: { createdAt: { gte: start } },
      select: { plannedQty: true, producedQty: true, defectQty: true, status: true },
    }),
    prisma.productionLog.findMany({
      where: { startTime: { gte: start } },
      select: { goodQty: true, defectQty: true, cycleTimeSec: true },
    }),
  ]);

  // 금월 생산량
  const monthProduced = monthWo.reduce((s, w) => s + w.producedQty, 0);
  const monthPlanned  = monthWo.reduce((s, w) => s + w.plannedQty,  0);
  const achieveRate   = monthPlanned > 0 ? Math.round((monthProduced / monthPlanned) * 100) : 0;

  // 불량률
  const totalGood   = logs.reduce((s, l) => s + l.goodQty,   0);
  const totalDefect = logs.reduce((s, l) => s + l.defectQty, 0);
  const defectRate  = (totalGood + totalDefect) > 0
    ? ((totalDefect / (totalGood + totalDefect)) * 100).toFixed(1)
    : '0.0';

  // 납기 준수율
  const dueOrders   = allWo.filter((w) => new Date(w.dueDate) < now);
  const onTimeCount = dueOrders.filter((w) => w.status === 'completed').length;
  const otdRate     = dueOrders.length > 0 ? Math.round((onTimeCount / dueOrders.length) * 100) : 100;

  // 작업지시 완료율
  const completedWo = allWo.filter((w) => w.status === 'completed').length;
  const woCompleteRate = allWo.length > 0 ? Math.round((completedWo / allWo.length) * 100) : 0;

  // 금월 생산 실적 상위 작업지시
  const topWo = await prisma.workOrder.findMany({
    where:   { createdAt: { gte: start }, producedQty: { gt: 0 } },
    include: { product: { select: { name: true, code: true } } },
    orderBy: { producedQty: 'desc' },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">모니터링/KPI — 생산성</h1>
        <p className="text-sm text-slate-500">
          {now.getFullYear()}년 {now.getMonth() + 1}월 기준
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="금월 생산량"
          value={monthProduced.toLocaleString()}
          unit="EA"
          sub={`계획 ${monthPlanned.toLocaleString()} EA`}
          color="border-blue-500"
        />
        <KpiCard
          label="목표달성률"
          value={achieveRate}
          unit="%"
          sub={`완료 ${completedWo} / 전체 ${allWo.length}건`}
          color={achieveRate >= 90 ? 'border-green-500' : achieveRate >= 70 ? 'border-yellow-400' : 'border-red-400'}
        />
        <KpiCard
          label="불량률"
          value={defectRate}
          unit="%"
          sub={`불량 ${totalDefect.toLocaleString()} EA`}
          color={Number(defectRate) <= 1 ? 'border-green-500' : Number(defectRate) <= 3 ? 'border-yellow-400' : 'border-red-400'}
        />
        <KpiCard
          label="납기 준수율 (OTD)"
          value={otdRate}
          unit="%"
          sub={`준수 ${onTimeCount} / 납기도래 ${dueOrders.length}건`}
          color={otdRate >= 95 ? 'border-green-500' : otdRate >= 80 ? 'border-yellow-400' : 'border-red-400'}
        />
      </div>

      {/* 금월 생산 실적 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">금월 생산 실적 현황</h2>
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">금월 생산 실적</caption>
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500">작업지시번호</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500">품목</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-slate-500">계획</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-slate-500">생산</th>
              <th scope="col" className="px-5 py-3 text-right text-xs font-medium text-slate-500">불량</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-slate-500">달성률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topWo.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">데이터가 없습니다.</td></tr>
            ) : topWo.map((wo) => {
              const pct = wo.plannedQty > 0 ? Math.min(100, Math.round((wo.producedQty / wo.plannedQty) * 100)) : 0;
              return (
                <tr key={wo.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-blue-600">{wo.woNo}</td>
                  <td className="px-5 py-3 text-slate-700">{wo.product.name}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{wo.plannedQty.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">{wo.producedQty.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-red-500">{wo.defectQty > 0 ? wo.defectQty.toLocaleString() : '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : 'bg-yellow-400'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-600 w-9">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
