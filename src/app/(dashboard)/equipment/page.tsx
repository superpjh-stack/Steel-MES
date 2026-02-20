import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const STATUS_LABEL: Record<string, string> = {
  running: '가동', stopped: '정지', maintenance: '보전', breakdown: '고장',
};
const STATUS_COLOR: Record<string, string> = {
  running: 'bg-green-100 text-green-700 border-green-200',
  stopped: 'bg-gray-100 text-gray-600 border-gray-200',
  maintenance: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  breakdown: 'bg-red-100 text-red-700 border-red-200',
};

export default async function EquipmentPage() {
  const equipment = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">설비 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((eq) => (
          <div key={eq.id} className={`rounded-lg border p-4 ${STATUS_COLOR[eq.status]}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs opacity-70">{eq.code}</p>
                <p className="font-semibold text-sm mt-1">{eq.name}</p>
                <p className="text-xs opacity-60 mt-0.5">{eq.location}</p>
              </div>
              <span className="text-xs font-medium">{STATUS_LABEL[eq.status]}</span>
            </div>
            {eq.pmCycleDays && eq.lastPmDate && (
              <p className="text-xs opacity-60 mt-2">
                최근 PM: {new Date(eq.lastPmDate).toLocaleDateString('ko-KR')}
                (주기 {eq.pmCycleDays}일)
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
