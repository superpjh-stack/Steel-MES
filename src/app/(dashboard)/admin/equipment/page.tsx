import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function AdminEquipmentPage() {
  await auth();

  const equipment = await prisma.equipment.findMany({
    include: {
      _count: { select: { productionLogs: true, maintenances: true } },
    },
    orderBy: { code: 'asc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">설비 마스터</h2>
        <span className="text-sm text-gray-500">총 {equipment.length}대</span>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['설비코드', '설비명', '위치', '상태', 'PM주기', '최근PM', '생산실적', '보전이력'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {equipment.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{eq.code}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{eq.name}</td>
                <td className="px-4 py-2.5 text-gray-500">{eq.location ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge value={eq.status} type="equipment" />
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {eq.pmCycleDays ? `${eq.pmCycleDays}일` : '-'}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500">
                  {eq.lastPmDate ? new Date(eq.lastPmDate).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{eq._count.productionLogs}건</td>
                <td className="px-4 py-2.5 text-gray-600">{eq._count.maintenances}건</td>
              </tr>
            ))}
            {equipment.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">설비가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
