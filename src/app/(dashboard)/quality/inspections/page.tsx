import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const RESULT_COLOR: Record<string, string> = {
  pass: 'bg-green-100 text-green-700',
  fail: 'bg-red-100 text-red-700',
  conditional: 'bg-yellow-100 text-yellow-700',
};
const TYPE_LABEL: Record<string, string> = {
  incoming: '수입검사', in_process: '공정검사', outgoing: '출하검사',
};

export default async function InspectionsPage() {
  const inspections = await prisma.inspectionRecord.findMany({
    include: {
      inspector: { select: { name: true } },
      workOrder: { select: { woNo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">품질 검사 기록</h2>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['검사유형', 'WO번호', '로트번호', '샘플', '합격', '불합격', '결과', '검사자', '일시'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inspections.map((ins) => (
              <tr key={ins.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{TYPE_LABEL[ins.type]}</td>
                <td className="px-4 py-3 font-mono text-blue-600 text-xs">{ins.workOrder.woNo}</td>
                <td className="px-4 py-3 font-mono text-xs">{ins.lotNo}</td>
                <td className="px-4 py-3">{ins.sampleQty}</td>
                <td className="px-4 py-3 text-green-600">{ins.passQty}</td>
                <td className="px-4 py-3 text-red-500">{ins.failQty}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${RESULT_COLOR[ins.result]}`}>
                    {ins.result === 'pass' ? '합격' : ins.result === 'fail' ? '불합격' : '조건부'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{ins.inspector.name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(ins.inspectionDate).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
            {inspections.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">검사 기록이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
