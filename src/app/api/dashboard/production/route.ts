import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const [todayLogs, activeOrders, equipmentStatus] = await Promise.all([
    prisma.productionLog.aggregate({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      _sum: { goodQty: true, defectQty: true, plannedQty: true },
    }),
    prisma.workOrder.count({ where: { status: 'in_progress' } }),
    prisma.equipment.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ]);

  const planned = todayLogs._sum.plannedQty ?? 0;
  const produced = todayLogs._sum.goodQty ?? 0;
  const defects = todayLogs._sum.defectQty ?? 0;

  return NextResponse.json({
    plannedQty: planned,
    producedQty: produced,
    defectQty: defects,
    achievementRate: planned > 0 ? Math.round((produced / planned) * 100) : 0,
    defectRate: produced + defects > 0
      ? Math.round((defects / (produced + defects)) * 1000) / 10
      : 0,
    activeOrders,
    equipmentStatus: Object.fromEntries(
      equipmentStatus.map((e) => [e.status, e._count.status])
    ),
  });
}
