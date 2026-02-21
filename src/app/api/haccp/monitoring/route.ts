import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok, created, fail, parsePagination } from '@/lib/api/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  const { page, limit, skip } = parsePagination(req.nextUrl);
  const { searchParams } = req.nextUrl;
  const result     = searchParams.get('result');
  const haccpPlanId = searchParams.get('haccpPlanId');

  const [logs, total] = await Promise.all([
    prisma.ccpMonitoring.findMany({
      where: {
        ...(result      ? { result }      : {}),
        ...(haccpPlanId ? { haccpPlanId } : {}),
      },
      include: {
        haccpPlan: { select: { ccpNo: true, criticalLimit: true, hazardType: true } },
      },
      orderBy: { monitoredAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.ccpMonitoring.count({
      where: {
        ...(result      ? { result }      : {}),
        ...(haccpPlanId ? { haccpPlanId } : {}),
      },
    }),
  ]);
  return ok(logs, { page, limit, total });
});

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const { haccpPlanId, workOrderId, lotNo, measuredValue, result, deviationNote, monitoredAt } = body;

    if (!haccpPlanId || !measuredValue || !result) {
      return fail(400, 'BAD_REQUEST', 'haccpPlanId, measuredValue, result는 필수입니다.');
    }

    const log = await prisma.ccpMonitoring.create({
      data: {
        haccpPlanId,
        workOrderId:    workOrderId ?? null,
        lotNo:          lotNo ?? null,
        measuredValue,
        result,
        deviationNote:  deviationNote ?? null,
        monitoredAt:    new Date(monitoredAt ?? Date.now()),
        operatorId:     user.id,
      },
    });
    return created(log);
  },
  ['operator', 'qc', 'supervisor', 'manager', 'admin'],
);
