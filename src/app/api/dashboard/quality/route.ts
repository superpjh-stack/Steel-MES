import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today      = new Date();
  const dayStart   = startOfDay(today);
  const dayEnd     = endOfDay(today);
  const monthStart = startOfMonth(today);
  const monthEnd   = endOfMonth(today);

  const [todayInsp, monthInsp, openNcr, defectStats, recentDefects] = await Promise.all([
    // 금일 검사 집계
    prisma.inspectionRecord.aggregate({
      where: { inspectionDate: { gte: dayStart, lte: dayEnd } },
      _count: { id: true },
      _sum: { sampleQty: true, passQty: true, failQty: true },
    }),
    // 이번 달 검사 집계
    prisma.inspectionRecord.groupBy({
      by: ['result'],
      where: { inspectionDate: { gte: monthStart, lte: monthEnd } },
      _count: { id: true },
    }),
    // 미처리 NCR
    prisma.nonconformanceReport.count({ where: { status: { in: ['open', 'under_review'] } } }),
    // 불량 유형별 집계 (이번 달)
    prisma.defectLog.groupBy({
      by: ['defectCode', 'defectName'],
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: 5,
    }),
    // 최근 불량 5건
    prisma.defectLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const monthResultMap = Object.fromEntries(monthInsp.map((r) => [r.result, r._count.id]));
  const monthTotal = monthInsp.reduce((s, r) => s + r._count.id, 0);
  const passRate   = monthTotal > 0 ? Math.round(((monthResultMap['pass'] ?? 0) / monthTotal) * 100) : 0;

  return NextResponse.json({
    today: {
      inspections: todayInsp._count.id,
      sampleQty:   todayInsp._sum.sampleQty ?? 0,
      passQty:     todayInsp._sum.passQty   ?? 0,
      failQty:     todayInsp._sum.failQty   ?? 0,
    },
    month: {
      total:    monthTotal,
      pass:     monthResultMap['pass']        ?? 0,
      fail:     monthResultMap['fail']        ?? 0,
      conditional: monthResultMap['conditional'] ?? 0,
      passRate,
    },
    openNcr,
    topDefects: defectStats.map((d) => ({
      code: d.defectCode,
      name: d.defectName,
      qty:  d._sum.qty ?? 0,
    })),
    recentDefects,
  });
}
