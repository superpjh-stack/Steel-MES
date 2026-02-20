import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import Link from 'next/link';

const TYPE_LABEL: Record<string, string> = { preventive: '예방', corrective: '수리', emergency: '긴급' };
const TYPE_COLOR: Record<string, string> = {
  preventive: 'bg-blue-100 text-blue-700',
  corrective: 'bg-yellow-100 text-yellow-700',
  emergency:  'bg-red-100 text-red-700',
};

export default async function MaintenancePage() {
  await auth();

  const records = await prisma.maintenanceRecord.findMany({
    include: {
      equipment:  { select: { name: true, code: true } },
      technician: { select: { name: true } },
    },
    orderBy: { startTime: 'desc' },
    take: 100,
  });

  const totalCost = records.reduce((s, r) => s + Number(r.cost ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">보전 이력</h2>
          <p className="text-sm text-gray-500 mt-0.5">총 비용 ₩{totalCost.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['설비', '유형', '내용', '기술자', '시작일', '종료일', '소요시간', '비용'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const duration = r.endTime
                ? Math.round((r.endTime.getTime() - r.startTime.getTime()) / 60000)
                : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{r.equipment.name}</p>
                    <p className="text-xs font-mono text-gray-400">{r.equipment.code}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[r.type]}`}>
                      {TYPE_LABEL[r.type]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.technician.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(r.startTime).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{r.endTime ? new Date(r.endTime).toLocaleDateString('ko-KR') : '-'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{duration != null ? `${duration}분` : '-'}</td>
                  <td className="px-4 py-2.5 text-gray-700">{r.cost ? `₩${Number(r.cost).toLocaleString()}` : '-'}</td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">보전 이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
