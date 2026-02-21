import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok, created, fail, parsePagination } from '@/lib/api/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  const { page, limit, skip } = parsePagination(req.nextUrl);
  const { searchParams } = req.nextUrl;
  const area   = searchParams.get('area');
  const result = searchParams.get('result');

  const [checks, total] = await Promise.all([
    prisma.hygieneCheck.findMany({
      where: {
        ...(area   ? { area }   : {}),
        ...(result ? { result } : {}),
      },
      orderBy: { checkDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.hygieneCheck.count({
      where: {
        ...(area   ? { area }   : {}),
        ...(result ? { result } : {}),
      },
    }),
  ]);
  return ok(checks, { page, limit, total });
});

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const { checkDate, shift, area, items, result, failItems, correctiveAction, notes } = body;

    if (!shift || !area || !items || !result) {
      return fail(400, 'BAD_REQUEST', '필수 항목이 누락되었습니다.');
    }

    const check = await prisma.hygieneCheck.create({
      data: {
        checkDate:        new Date(checkDate ?? Date.now()),
        shift,
        area,
        checkedById:      user.id,
        items:            typeof items === 'string' ? items : JSON.stringify(items),
        result,
        failItems:        failItems ?? null,
        correctiveAction: correctiveAction ?? null,
        notes:            notes ?? null,
      },
    });
    return created(check);
  },
  ['qc', 'supervisor', 'manager', 'admin'],
);
