import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  draft: '초안', issued: '발행', in_progress: '진행중', completed: '완료', cancelled: '취소',
};
const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default async function WorkOrdersPage() {
  const session = await auth();

  const workOrders = await prisma.workOrder.findMany({
    include: {
      product: { select: { name: true, code: true } },
      customer: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">작업지시 관리</h2>
        <Link
          href="/production/work-orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + 작업지시 생성
        </Link>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['WO번호', '품목', '고객사', '계획수량', '실적/불량', '납기', '우선순위', '상태'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workOrders.map((wo) => {
              const rate = wo.plannedQty > 0 ? Math.round((wo.producedQty / wo.plannedQty) * 100) : 0;
              return (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">{wo.woNo}</td>
                  <td className="px-4 py-3">{wo.product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{wo.customer.name}</td>
                  <td className="px-4 py-3">{wo.plannedQty.toLocaleString()} EA</td>
                  <td className="px-4 py-3">
                    <span className="text-green-600">{wo.producedQty}</span>
                    {' / '}
                    <span className="text-red-500">{wo.defectQty}</span>
                    <span className="text-gray-400 text-xs ml-1">({rate}%)</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(wo.dueDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-center">{wo.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[wo.status]}`}>
                      {STATUS_LABEL[wo.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {workOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">작업지시가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
