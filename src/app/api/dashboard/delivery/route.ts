import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const [shipmentStats, urgentWos, overdueWos, customerStats] = await Promise.all([
    // 이번달 출하 집계
    prisma.shipment.groupBy({
      by: ['status'],
      where: { plannedDate: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
    }),
    // 납기 임박 WO (3일 이내)
    prisma.workOrder.findMany({
      where: {
        status: { in: ['issued', 'in_progress'] },
        dueDate: { gte: now, lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      },
      include: {
        product:  { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    // 납기 초과 WO
    prisma.workOrder.findMany({
      where: {
        status: { in: ['issued', 'in_progress'] },
        dueDate: { lt: now },
      },
      include: {
        product:  { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
    // 고객사별 출하 현황
    prisma.shipment.groupBy({
      by: ['customerId'],
      where: { plannedDate: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
      _sum:   { shippedQty: true },
    }),
  ]);

  const statusMap     = Object.fromEntries(shipmentStats.map((s) => [s.status, s._count.id]));
  const totalShipped  = Object.values(statusMap).reduce((s, v) => s + v, 0);
  const deliveredQty  = statusMap['delivered'] ?? 0;
  const otdRate       = totalShipped > 0 ? Math.round((deliveredQty / totalShipped) * 100) : 0;

  const customerIds = customerStats.map((c) => c.customerId);
  const customers   = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, otdTarget: true },
  });
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]));

  return NextResponse.json({
    shipmentStats: statusMap,
    otdRate,
    urgentWos:  urgentWos.map((wo) => ({
      id:           wo.id,
      woNo:         wo.woNo,
      productName:  wo.product.name,
      customerName: wo.customer.name,
      dueDate:      wo.dueDate,
      daysLeft:     Math.ceil((wo.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    })),
    overdueWos: overdueWos.map((wo) => ({
      id:           wo.id,
      woNo:         wo.woNo,
      productName:  wo.product.name,
      customerName: wo.customer.name,
      dueDate:      wo.dueDate,
      daysOver:     Math.ceil((now.getTime() - wo.dueDate.getTime()) / (24 * 60 * 60 * 1000)),
    })),
    byCustomer: customerStats.map((s) => ({
      customerName: customerMap[s.customerId]?.name ?? s.customerId,
      otdTarget:    Number(customerMap[s.customerId]?.otdTarget ?? 98),
      shipments:    s._count.id,
      shippedQty:   s._sum.shippedQty ?? 0,
    })),
  });
}
