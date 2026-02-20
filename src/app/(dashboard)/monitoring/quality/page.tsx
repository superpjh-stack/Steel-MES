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

export default async function MonitoringQualityPage() {
  await auth();

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const [inspections, defects, ncrs] = await Promise.all([
    prisma.inspectionRecord.findMany({
      where:   { inspectionDate: { gte: start } },
      select:  { sampleQty: true, passQty: true, failQty: true, result: true, type: true },
    }),
    prisma.defectLog.findMany({
      where:   { createdAt: { gte: start } },
      select:  { qty: true, defectCode: true, defectName: true, disposition: true },
    }),
    prisma.nonconformanceReport.findMany({
      where:   { createdAt: { gte: start } },
      select:  { status: true, createdAt: true },
    }),
  ]);

  // 검사 합격률
  const totalSample = inspections.reduce((s, i) => s + i.sampleQty, 0);
  const totalPass   = inspections.reduce((s, i) => s + i.passQty,   0);
  const passRate    = totalSample > 0 ? ((totalPass / totalSample) * 100).toFixed(1) : '0.0';

  // 불량건수
  const totalDefectQty = defects.reduce((s, d) => s + d.qty, 0);

  // NCR 미결건수
  const openNcr = ncrs.filter((n) => n.status === 'open').length;

  // 검사유형별
  const incoming  = inspections.filter((i) => i.type === 'incoming');
  const inProcess = inspections.filter((i) => i.type === 'in_process');
  const outgoing  = inspections.filter((i) => i.type === 'outgoing');
  const typeRate  = (arr: typeof inspections) => {
    const s = arr.reduce((a, b) => a + b.sampleQty, 0);
    const p = arr.reduce((a, b) => a + b.passQty,   0);
    return s > 0 ? ((p / s) * 100).toFixed(1) : '-';
  };

  // 불량코드별 집계
  const defectMap = new Map<string, { name: string; qty: number }>();
  for (const d of defects) {
    const prev = defectMap.get(d.defectCode);
    if (prev) prev.qty += d.qty;
    else defectMap.set(d.defectCode, { name: d.defectName, qty: d.qty });
  }
  const defectRanking = Array.from(defectMap.entries())
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">모니터링/KPI — 품질</h1>
        <p className="text-sm text-slate-500">
          {now.getFullYear()}년 {now.getMonth() + 1}월 기준
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="검사 합격률"
          value={passRate}
          unit="%"
          sub={`검사 ${totalSample.toLocaleString()} / 합격 ${totalPass.toLocaleString()}`}
          color={Number(passRate) >= 98 ? 'border-green-500' : Number(passRate) >= 95 ? 'border-yellow-400' : 'border-red-400'}
        />
        <KpiCard
          label="금월 불량건수"
          value={totalDefectQty.toLocaleString()}
          unit="EA"
          sub={`${defectMap.size}개 코드 발생`}
          color={totalDefectQty === 0 ? 'border-green-500' : totalDefectQty <= 10 ? 'border-yellow-400' : 'border-red-400'}
        />
        <KpiCard
          label="미결 NCR"
          value={openNcr}
          unit="건"
          sub={`전체 ${ncrs.length}건`}
          color={openNcr === 0 ? 'border-green-500' : openNcr <= 3 ? 'border-yellow-400' : 'border-red-400'}
        />
        <KpiCard
          label="검사 건수"
          value={inspections.length}
          unit="건"
          sub={`입고 ${incoming.length} / 공정 ${inProcess.length} / 출하 ${outgoing.length}`}
          color="border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 검사유형별 합격률 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">검사유형별 합격률</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: '입고검사',  arr: incoming,  color: 'bg-blue-500' },
              { label: '공정검사',  arr: inProcess, color: 'bg-purple-500' },
              { label: '출하검사',  arr: outgoing,  color: 'bg-green-500' },
            ].map(({ label, arr, color }) => {
              const rate = Number(typeRate(arr));
              const cnt  = arr.length;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {cnt > 0 ? `${rate}%` : '-'}
                      <span className="text-xs font-normal text-slate-400 ml-1">({cnt}건)</span>
                    </span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2.5" role="progressbar" aria-valuenow={cnt > 0 ? rate : 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} 합격률`}>
                    <div className={`h-2.5 rounded-full ${color}`} style={{ width: cnt > 0 ? `${rate}%` : '0%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 불량코드 랭킹 */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">불량코드 TOP 발생 현황</h2>
          </div>
          {defectRanking.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">불량 기록이 없습니다.</p>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">불량코드 랭킹</caption>
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">순위</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">코드</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">불량명</th>
                  <th scope="col" className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">수량</th>
                  <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">비율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defectRanking.map((d, i) => {
                  const pct = totalDefectQty > 0 ? Math.round((d.qty / totalDefectQty) * 100) : 0;
                  return (
                    <tr key={d.code} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-600">{d.code}</td>
                      <td className="px-5 py-2.5 text-slate-700">{d.name}</td>
                      <td className="px-5 py-2.5 text-right font-semibold text-slate-800">{d.qty}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
