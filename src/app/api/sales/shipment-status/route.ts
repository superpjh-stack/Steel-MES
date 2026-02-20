import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [salesOrders, shipments] = await Promise.all([
    prisma.salesOrder.findMany({
      include: {
        customer: { select: { name: true, code: true } },
        product:  { select: { name: true, code: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.shipment.findMany({
      select: { workOrderId: true, shippedQty: true, status: true, actualDate: true },
    }),
  ]);

  // WorkOrder를 경유해서 SalesOrder ↔ Shipment를 연결하기 어려우므로
  // SalesOrder별 수주수량 대비 출고수량을 WorkOrder를 통해 집계
  const workOrders = await prisma.workOrder.findMany({
    select: { id: true, productId: true, customerId: true, producedQty: true, status: true, dueDate: true },
  });

  const shipByWo = new Map<string, number>();
  for (const s of shipments) {
    shipByWo.set(s.workOrderId, (shipByWo.get(s.workOrderId) ?? 0) + s.shippedQty);
  }

  const result = salesOrders.map(so => {
    const relatedWOs = workOrders.filter(wo => wo.customerId === so.customerId && wo.productId === so.productId);
    const shippedQty = relatedWOs.reduce((acc, wo) => acc + (shipByWo.get(wo.id) ?? 0), 0);
    const rate = so.orderedQty > 0 ? Math.min(100, Math.round((shippedQty / so.orderedQty) * 100)) : 0;
    return { ...so, shippedQty, rate };
  });

  return NextResponse.json({ data: result });
}
