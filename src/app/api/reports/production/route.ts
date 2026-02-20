import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? format(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const to   = searchParams.get('to')   ?? format(new Date(), 'yyyy-MM-dd');

  const fromDate = startOfDay(new Date(from));
  const toDate   = endOfDay(new Date(to));

  const days = eachDayOfInterval({ start: fromDate, end: toDate });

  // 날짜별 집계
  const logs = await prisma.productionLog.findMany({
    where: { createdAt: { gte: fromDate, lte: toDate } },
    select: { goodQty: true, defectQty: true, plannedQty: true, createdAt: true },
  });

  const byDay: Record<string, { planned: number; produced: number; defect: number }> = {};
  for (const day of days) {
    byDay[format(day, 'MM/dd')] = { planned: 0, produced: 0, defect: 0 };
  }
  for (const log of logs) {
    const key = format(log.createdAt, 'MM/dd');
    if (byDay[key]) {
      byDay[key].planned  += log.plannedQty;
      byDay[key].produced += log.goodQty;
      byDay[key].defect   += log.defectQty;
    }
  }

  const daily = Object.entries(byDay).map(([label, v]) => ({ label, ...v }));

  // 품목별 집계
  const byProduct = await prisma.workOrder.groupBy({
    by: ['productId'],
    where: { updatedAt: { gte: fromDate, lte: toDate } },
    _sum: { producedQty: true, defectQty: true, plannedQty: true },
  });
  const productIds = byProduct.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, code: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  const byProductSummary = byProduct.map((r) => ({
    productName: productMap[r.productId]?.name ?? r.productId,
    productCode: productMap[r.productId]?.code ?? '',
    planned:     r._sum.plannedQty ?? 0,
    produced:    r._sum.producedQty ?? 0,
    defect:      r._sum.defectQty ?? 0,
    achievementRate: (r._sum.plannedQty ?? 0) > 0
      ? Math.round(((r._sum.producedQty ?? 0) / (r._sum.plannedQty ?? 0)) * 100)
      : 0,
  }));

  // 전체 집계
  const totals = daily.reduce((acc, d) => ({
    planned:  acc.planned  + d.planned,
    produced: acc.produced + d.produced,
    defect:   acc.defect   + d.defect,
  }), { planned: 0, produced: 0, defect: 0 });

  return NextResponse.json({ daily, byProduct: byProductSummary, totals, from, to });
}
