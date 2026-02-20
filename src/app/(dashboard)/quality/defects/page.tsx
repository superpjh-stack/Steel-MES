import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import StatusBadge from '@/components/ui/StatusBadge';

const DISP_LABEL: Record<string, string> = {
  rework: '재작업', scrap: '폐기', use_as_is: '특채', return: '반납',
};
const DISP_COLOR: Record<string, string> = {
  rework: 'text-yellow-600', scrap: 'text-red-600', use_as_is: 'text-blue-600', return: 'text-gray-600',
};

export default async function DefectsPage() {
  await auth();

  const defects = await prisma.defectLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // 불량 유형별 집계
  const summary = defects.reduce((acc, d) => {
    const key = `${d.defectCode}|${d.defectName}`;
    if (!acc[key]) acc[key] = { code: d.defectCode, name: d.defectName, qty: 0, count: 0 };
    acc[key].qty   += d.qty;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { code: string; name: string; qty: number; count: number }>);

  const summaryList = Object.values(summary).sort((a, b) => b.qty - a.qty);
  const totalQty = defects.reduce((s, d) => s + d.qty, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">불량 이력</h2>

      {/* 파레토 요약 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">불량 유형별 집계</h3>
        <div className="space-y-2">
          {summaryList.map((s) => {
            const pct = totalQty > 0 ? Math.round((s.qty / totalQty) * 100) : 0;
            return (
              <div key={s.code} className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-20">{s.code}</span>
                <span className="text-sm text-gray-700 w-32 truncate">{s.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm font-semibold text-red-600 w-16 text-right">{s.qty.toLocaleString()}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
            );
          })}
          {summaryList.length === 0 && <p className="text-sm text-gray-400">불량 데이터가 없습니다.</p>}
        </div>
      </div>

      {/* 이력 테이블 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">불량 이력 ({defects.length}건 · 총 {totalQty.toLocaleString()}개)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['불량코드', '불량명', '수량', '처리방법', '근본원인', '시정조치', '등록일'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {defects.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{d.defectCode}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{d.defectName}</td>
                <td className="px-4 py-2.5 text-red-600 font-semibold">{d.qty.toLocaleString()}</td>
                <td className={`px-4 py-2.5 font-medium ${DISP_COLOR[d.disposition]}`}>
                  {DISP_LABEL[d.disposition]}
                </td>
                <td className="px-4 py-2.5 text-gray-600 text-xs max-w-32 truncate">{d.rootCause ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs max-w-32 truncate">{d.correctiveAction ?? '-'}</td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {new Date(d.createdAt).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
            {defects.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">불량 데이터가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
