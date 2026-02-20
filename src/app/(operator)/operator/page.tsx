import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function OperatorPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  const workOrders = await prisma.workOrder.findMany({
    where: { status: { in: ['issued', 'in_progress'] } },
    include: {
      product: { select: { name: true, code: true } },
      customer: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    take: 20,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">오늘의 작업지시</h2>
      <div className="grid gap-4">
        {workOrders.map((wo) => {
          const rate = wo.plannedQty > 0
            ? Math.round((wo.producedQty / wo.plannedQty) * 100)
            : 0;
          return (
            <Link
              key={wo.id}
              href={`/operator/${wo.id}/input`}
              className="bg-gray-700 rounded-xl p-5 hover:bg-gray-600 transition-colors block"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono text-blue-300 text-sm">{wo.woNo}</p>
                  <p className="font-bold text-lg mt-1">{wo.product.name}</p>
                  <p className="text-gray-400 text-sm">{wo.customer.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  wo.status === 'in_progress' ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                }`}>
                  {wo.status === 'in_progress' ? '진행중' : '발행'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">목표: <strong className="text-white">{wo.plannedQty} EA</strong></span>
                <span className="text-gray-400">실적: <strong className="text-green-400">{wo.producedQty}</strong></span>
                <span className="text-gray-400">불량: <strong className="text-red-400">{wo.defectQty}</strong></span>
              </div>
              <div className="mt-2 bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${rate >= 90 ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(rate, 100)}%` }}
                />
              </div>
              <p className="text-right text-xs text-gray-400 mt-1">{rate}%</p>
            </Link>
          );
        })}
        {workOrders.length === 0 && (
          <div className="bg-gray-700 rounded-xl p-8 text-center text-gray-400">
            배정된 작업이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
