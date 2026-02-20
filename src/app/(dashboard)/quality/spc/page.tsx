import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import SpcPageClient from './SpcPageClient';

export default async function SpcPage() {
  await auth();

  // 특성 목록, WO 목록, 공정 목록 조회
  const [characteristics, workOrders, processes] = await Promise.all([
    prisma.spcMeasurement.findMany({
      distinct: ['characteristic'],
      select: { characteristic: true },
      orderBy: { characteristic: 'asc' },
    }),
    prisma.workOrder.findMany({
      where: { status: { in: ['in_progress', 'completed'] } },
      select: { id: true, woNo: true, product: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.process.findMany({
      select: { id: true, name: true },
      orderBy: { seq: 'asc' },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">SPC 관리도</h2>
      <SpcPageClient
        characteristics={characteristics.map((c) => c.characteristic)}
        workOrders={workOrders.map((wo) => ({ id: wo.id, label: `${wo.woNo} — ${wo.product.name}` }))}
        processes={processes}
      />
    </div>
  );
}
