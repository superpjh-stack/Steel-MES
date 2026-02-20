import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';
import KpiCard from '@/components/ui/KpiCard';

export default async function QualityReportsPage() {
  await auth();

  const monthStart = startOfMonth(new Date());
  const monthEnd   = endOfMonth(new Date());

  const [inspStats, defectStats, ncrStats, topDefects] = await Promise.all([
    prisma.inspectionRecord.groupBy({
      by: ['result'],
      where: { inspectionDate: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      _sum:   { sampleQty: true, passQty: true, failQty: true },
    }),
    prisma.defectLog.aggregate({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      _sum:   { qty: true },
    }),
    prisma.nonconformanceReport.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.defectLog.groupBy({
      by: ['defectCode', 'defectName'],
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 5,
    }),
  ]);

  const totalInsp   = inspStats.reduce((s, r) => s + r._count.id, 0);
  const passCount   = inspStats.find((r) => r.result === 'pass')?._count.id ?? 0;
  const passRate    = totalInsp > 0 ? Math.round((passCount / totalInsp) * 100) : 0;
  const totalDefQty = defectStats._sum.qty ?? 0;
  const ncrMap      = Object.fromEntries(ncrStats.map((r) => [r.status, r._count.id]));
  const openNcr     = (ncrMap['open'] ?? 0) + (ncrMap['under_review'] ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">품질 리포트</h2>
        <p className="text-sm text-gray-500">{format(new Date(), 'yyyy년 M월')} 기준</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="이번달 검사" value={totalInsp.toLocaleString()} unit="건" color="blue" />
        <KpiCard label="검사 합격률" value={passRate} unit="%" color={passRate >= 95 ? 'green' : passRate >= 85 ? 'yellow' : 'red'} />
        <KpiCard label="불량 발생량" value={totalDefQty.toLocaleString()} unit="개" color={totalDefQty > 100 ? 'red' : 'gray'} />
        <KpiCard label="미처리 NCR" value={openNcr} unit="건" color={openNcr > 0 ? 'red' : 'green'} />
      </div>

      {/* 검사 결과 분포 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">검사 결과 분포</h3>
        <div className="space-y-2">
          {inspStats.map((r) => {
            const pct = totalInsp > 0 ? Math.round((r._count.id / totalInsp) * 100) : 0;
            return (
              <div key={r.result} className="flex items-center gap-3">
                <StatusBadge value={r.result} type="inspection" />
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${r.result === 'pass' ? 'bg-green-500' : r.result === 'fail' ? 'bg-red-500' : 'bg-yellow-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{r._count.id}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
          {inspStats.length === 0 && <p className="text-sm text-gray-400">데이터가 없습니다.</p>}
        </div>
      </div>

      {/* 상위 불량 유형 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">상위 불량 유형 (파레토)</h3>
        <div className="space-y-2">
          {topDefects.map((d) => {
            const qty = d._sum.qty ?? 0;
            const pct = totalDefQty > 0 ? Math.round((qty / totalDefQty) * 100) : 0;
            return (
              <div key={d.defectCode} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-24">{d.defectCode}</span>
                <span className="text-sm text-gray-700 w-28 truncate">{d.defectName}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-400 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-semibold text-red-600 w-12 text-right">{qty}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
          {topDefects.length === 0 && <p className="text-sm text-gray-400">불량 데이터가 없습니다.</p>}
        </div>
      </div>

      {/* NCR 현황 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">NCR 현황</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: '접수', key: 'open',         color: 'text-red-600' },
            { label: '검토중', key: 'under_review', color: 'text-yellow-600' },
            { label: '승인',  key: 'approved',     color: 'text-blue-600' },
            { label: '종결',  key: 'closed',       color: 'text-green-600' },
          ].map(({ label, key, color }) => (
            <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${color}`}>{ncrMap[key] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
