import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok, created, fail } from '@/lib/api/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status    = searchParams.get('status');
  const hazardType = searchParams.get('hazardType');

  const plans = await prisma.haccpPlan.findMany({
    where: {
      ...(status     ? { status }     : {}),
      ...(hazardType ? { hazardType } : {}),
    },
    include: {
      _count: { select: { monitoringLogs: true } },
    },
    orderBy: { ccpNo: 'asc' },
  });
  return ok(plans);
});

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const { ccpNo, hazardType, hazardDesc, criticalLimit, monitoringFreq, correctiveAction, verifyMethod, processCode, effectiveDate } = body;

    if (!ccpNo || !hazardType || !hazardDesc || !criticalLimit || !monitoringFreq || !correctiveAction) {
      return fail(400, 'BAD_REQUEST', '필수 항목이 누락되었습니다.');
    }

    const plan = await prisma.haccpPlan.create({
      data: {
        ccpNo,
        hazardType,
        hazardDesc,
        criticalLimit,
        monitoringFreq,
        correctiveAction,
        verifyMethod:   verifyMethod ?? null,
        processCode:    processCode ?? null,
        effectiveDate:  new Date(effectiveDate ?? Date.now()),
        status:         'active',
        createdById:    user.id,
      },
    });
    return created(plan);
  },
  ['admin', 'manager'],
);
