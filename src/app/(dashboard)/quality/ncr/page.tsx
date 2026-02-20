import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import NcrActions from './NcrActions';

const STATUS_LABEL: Record<string, string> = {
  open: '접수', under_review: '검토중', approved: '승인', closed: '종결',
};
const STATUS_COLOR: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  closed: 'bg-green-100 text-green-700',
};

export default async function NcrPage() {
  const session = await auth();
  const role    = (session?.user as any)?.role ?? '';

  const ncrs = await prisma.nonconformanceReport.findMany({
    include: {
      inspection: {
        select: {
          lotNo: true,
          type: true,
          workOrder: { select: { woNo: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const openCount = ncrs.filter((n) => ['open', 'under_review'].includes(n.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">부적합품 보고서 (NCR)</h2>
          {openCount > 0 && (
            <p className="text-sm text-red-600 mt-0.5">미처리 {openCount}건</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['NCR번호', 'WO번호', '로트번호', '검사유형', '처리방법', '상태', '승인일', '조치'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ncrs.map((ncr) => (
              <tr key={ncr.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700">{ncr.ncrNo}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{ncr.inspection.workOrder.woNo}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{ncr.inspection.lotNo}</td>
                <td className="px-4 py-2.5 text-gray-600 text-xs">
                  {ncr.inspection.type === 'incoming' ? '수입' : ncr.inspection.type === 'in_process' ? '공정' : '출하'}
                </td>
                <td className="px-4 py-2.5 text-gray-700">{ncr.disposition}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[ncr.status]}`}>
                    {STATUS_LABEL[ncr.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">
                  {ncr.approvedAt ? new Date(ncr.approvedAt).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-2.5">
                  {['qc', 'supervisor', 'manager', 'admin'].includes(role) && ncr.status !== 'closed' && (
                    <NcrActions ncrId={ncr.id} currentStatus={ncr.status} />
                  )}
                </td>
              </tr>
            ))}
            {ncrs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">NCR이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
