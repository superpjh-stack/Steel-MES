import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, eachDayOfInterval, format, subDays } from 'date-fns';
import ProductionReportClient from './ProductionReportClient';

async function getReportData(from: Date, to: Date) {
  const days = eachDayOfInterval({ start: from, end: to });

  const logs = await prisma.productionLog.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { goodQty: true, defectQty: true, plannedQty: true, createdAt: true },
  });

  const byDay: Record<string, { label: string; planned: number; produced: number; defect: number }> = {};
  for (const day of days) {
    const key = format(day, 'MM/dd');
    byDay[key] = { label: key, planned: 0, produced: 0, defect: 0 };
  }
  for (const log of logs) {
    const key = format(log.createdAt, 'MM/dd');
    if (byDay[key]) {
      byDay[key].planned  += log.plannedQty;
      byDay[key].produced += log.goodQty;
      byDay[key].defect   += log.defectQty;
    }
  }

  const woStats = await prisma.workOrder.groupBy({
    by: ['productId'],
    where: { updatedAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
    _sum: { producedQty: true, defectQty: true, plannedQty: true },
    _count: { id: true },
  });

  const productIds = woStats.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, code: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const byProduct = woStats.map((r) => ({
    productCode: productMap[r.productId]?.code ?? '',
    productName: productMap[r.productId]?.name ?? r.productId,
    woCount:     r._count.id,
    planned:     r._sum.plannedQty ?? 0,
    produced:    r._sum.producedQty ?? 0,
    defect:      r._sum.defectQty ?? 0,
  })).sort((a, b) => b.produced - a.produced);

  const totals = Object.values(byDay).reduce((acc, d) => ({
    planned:  acc.planned  + d.planned,
    produced: acc.produced + d.produced,
    defect:   acc.defect   + d.defect,
  }), { planned: 0, produced: 0, defect: 0 });

  return { daily: Object.values(byDay), byProduct, totals };
}

export default async function ProductionReportsPage() {
  await auth();

  const to   = endOfDay(new Date());
  const from = startOfDay(subDays(new Date(), 6));

  const { daily, byProduct, totals } = await getReportData(from, to);

  const achievementRate = totals.planned > 0 ? Math.round((totals.produced / totals.planned) * 100) : 0;
  const defectRate = (totals.produced + totals.defect) > 0
    ? ((totals.defect / (totals.produced + totals.defect)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">생산 실적 리포트</h2>
        <p className="text-sm text-gray-500">최근 7일 기준</p>
      </div>

      {/* 요약 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '계획 수량',  value: totals.planned.toLocaleString(),  unit: 'EA', color: 'blue' },
          { label: '생산 실적',  value: totals.produced.toLocaleString(), unit: 'EA', color: 'green' },
          { label: '불량 수량',  value: totals.defect.toLocaleString(),   unit: 'EA', color: parseFloat(defectRate) > 2 ? 'red' : 'gray' },
          { label: '달성률',     value: String(achievementRate),           unit: '%',  color: achievementRate >= 90 ? 'green' : 'yellow' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className={`rounded-lg border p-4 ${
            color === 'blue'   ? 'bg-blue-50 border-blue-200 text-blue-700'   :
            color === 'green'  ? 'bg-green-50 border-green-200 text-green-700' :
            color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
            color === 'red'    ? 'bg-red-50 border-red-200 text-red-700' :
            'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}<span className="text-sm ml-1">{unit}</span></p>
          </div>
        ))}
      </div>

      {/* 일별 차트 + 품목별 테이블 (클라이언트 컴포넌트) */}
      <ProductionReportClient daily={daily} byProduct={byProduct} />
    </div>
  );
}
