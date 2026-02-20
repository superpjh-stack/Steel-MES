import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import StatusBadge from '@/components/ui/StatusBadge';
import AlertBanner from '@/components/ui/AlertBanner';

export default async function PmSchedulePage() {
  await auth();

  const equipment = await prisma.equipment.findMany({
    where: { pmCycleDays: { not: null } },
    orderBy: { code: 'asc' },
  });

  const now = new Date();

  const schedule = equipment.map((eq) => {
    if (!eq.pmCycleDays || !eq.lastPmDate) {
      return { ...eq, nextPmDate: null, daysLeft: null, urgency: 'none' as const };
    }
    const nextPmDate = new Date(eq.lastPmDate.getTime() + eq.pmCycleDays * 24 * 60 * 60 * 1000);
    const daysLeft   = Math.ceil((nextPmDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const urgency    = daysLeft < 0 ? 'overdue' : daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'warning' : 'ok';
    return { ...eq, nextPmDate, daysLeft, urgency };
  }).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

  const overdueCount  = schedule.filter((e) => e.urgency === 'overdue').length;
  const criticalCount = schedule.filter((e) => e.urgency === 'critical').length;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">예방보전 일정표</h2>

      {overdueCount > 0 && (
        <AlertBanner variant="error"   title="PM 초과" message={`PM 주기 초과 설비 ${overdueCount}대`} />
      )}
      {criticalCount > 0 && (
        <AlertBanner variant="warning" title="PM 임박" message={`3일 이내 PM 도래 설비 ${criticalCount}대`} />
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['설비코드', '설비명', '위치', '상태', 'PM 주기', '최근 PM', '다음 PM', '잔여일', '상태'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedule.map((eq) => (
              <tr key={eq.id} className={`hover:bg-gray-50 ${eq.urgency === 'overdue' ? 'bg-red-50' : eq.urgency === 'critical' ? 'bg-yellow-50' : ''}`}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{eq.code}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{eq.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{eq.location ?? '-'}</td>
                <td className="px-4 py-2.5"><StatusBadge value={eq.status} type="equipment" /></td>
                <td className="px-4 py-2.5 text-gray-600">{eq.pmCycleDays}일</td>
                <td className="px-4 py-2.5 text-gray-500 text-xs">
                  {eq.lastPmDate ? new Date(eq.lastPmDate).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {eq.nextPmDate ? new Date(eq.nextPmDate).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-2.5 text-center font-semibold">
                  {eq.daysLeft === null ? '-' : (
                    <span className={eq.urgency === 'overdue' ? 'text-red-600' : eq.urgency === 'critical' ? 'text-orange-500' : eq.urgency === 'warning' ? 'text-yellow-600' : 'text-green-600'}>
                      {eq.daysLeft < 0 ? `${Math.abs(eq.daysLeft)}일 초과` : `${eq.daysLeft}일`}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {eq.urgency === 'overdue'  && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full">초과</span>}
                  {eq.urgency === 'critical' && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">긴급</span>}
                  {eq.urgency === 'warning'  && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">주의</span>}
                  {eq.urgency === 'ok'       && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full">정상</span>}
                </td>
              </tr>
            ))}
            {schedule.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">PM 일정이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
