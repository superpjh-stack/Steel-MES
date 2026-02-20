import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function AdminDefectCodesPage() {
  await auth();

  // DefectCode 마스터 모델이 없으므로 DefectLog에서 집계
  const rawGroups = await prisma.defectLog.groupBy({
    by: ['defectCode', 'defectName'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const totalLogs = rawGroups.reduce((sum, d) => sum + d._count.id, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">불량 코드 관리</h2>
        <div className="text-sm text-gray-500">
          코드 {rawGroups.length}개 · 누적 발생 {totalLogs}건
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['불량코드', '불량명', '발생건수', '비율'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rawGroups.map((d) => {
              const count = d._count.id;
              const pct   = totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0;
              return (
                <tr key={d.defectCode} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{d.defectCode}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{d.defectName}</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{count}건</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20">
                        <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rawGroups.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">불량 기록이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
