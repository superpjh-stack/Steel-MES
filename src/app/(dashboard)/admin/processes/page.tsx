import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function AdminProcessesPage() {
  await auth();

  const processes = await prisma.process.findMany({
    include: { _count: { select: { productionLogs: true } } },
    orderBy: { seq: 'asc' },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">공정 마스터</h2>
        <span className="text-sm text-gray-500">총 {processes.length}개</span>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['순서', '공정코드', '공정명', '표준시간(분)', '생산실적'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {processes.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-400 text-center w-12">{p.seq}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{p.code}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-2.5 text-gray-600">-</td>
                <td className="px-4 py-2.5 text-gray-600">{p._count.productionLogs}건</td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">공정이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
