import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok, created, fail, parsePagination } from '@/lib/api/api-response';

// 보고번호 자동 생성: FBR-YYYYMMDD-NNN
async function generateReportNo(): Promise<string> {
  const today  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `FBR-${today}`;
  const count  = await prisma.foreignBodyReport.count({
    where: { reportNo: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(3, '0')}`;
}

export const GET = withAuth(async (req: NextRequest) => {
  const { page, limit, skip } = parsePagination(req.nextUrl);
  const { searchParams } = req.nextUrl;
  const status      = searchParams.get('status');
  const foreignType = searchParams.get('foreignType');

  const [reports, total] = await Promise.all([
    prisma.foreignBodyReport.findMany({
      where: {
        ...(status      ? { status }      : {}),
        ...(foreignType ? { foreignType } : {}),
      },
      orderBy: { detectedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.foreignBodyReport.count({
      where: {
        ...(status      ? { status }      : {}),
        ...(foreignType ? { foreignType } : {}),
      },
    }),
  ]);
  return ok(reports, { page, limit, total });
});

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const { detectedAt, lotNo, productId, detectionPoint, foreignType, size, disposition, rootCause, correctiveAction, affectedQty } = body;

    if (!detectionPoint || !foreignType || !disposition) {
      return fail(400, 'BAD_REQUEST', '필수 항목이 누락되었습니다.');
    }

    const reportNo = await generateReportNo();
    const report = await prisma.foreignBodyReport.create({
      data: {
        reportNo,
        detectedAt:      new Date(detectedAt ?? Date.now()),
        lotNo:           lotNo ?? null,
        productId:       productId ?? null,
        detectionPoint,
        foreignType,
        size:            size ?? null,
        disposition,
        rootCause:       rootCause ?? null,
        correctiveAction: correctiveAction ?? null,
        affectedQty:     Number(affectedQty ?? 0),
        reportedById:    user.id,
        status:          'open',
      },
    });
    return created(report);
  },
  ['operator', 'qc', 'supervisor', 'manager', 'admin'],
);
