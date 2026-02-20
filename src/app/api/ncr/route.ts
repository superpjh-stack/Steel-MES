import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { withErrorHandler } from '@/lib/api/with-error-handler';
import { ok, created, fail, parsePagination } from '@/lib/api/api-response';
import { generateNcrNo } from '@/lib/services/sequence.service';

const createSchema = z.object({
  inspectionId: z.string().uuid(),
  disposition:  z.string().min(1),
});

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const ncrNo = await generateNcrNo();
    const ncr = await prisma.nonconformanceReport.create({
      data: { ...parsed.data, ncrNo },
      include: {
        inspection: { select: { lotNo: true, type: true, workOrder: { select: { woNo: true } } } },
      },
    });

    return created(ncr);
  }, ['qc', 'supervisor', 'manager', 'admin']),
);

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest) => {
    const url    = new URL(req.url);
    const status = url.searchParams.get('status');
    const { page, limit, skip } = parsePagination(url);

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.nonconformanceReport.findMany({
        where,
        include: {
          inspection: { select: { lotNo: true, type: true, workOrder: { select: { woNo: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.nonconformanceReport.count({ where }),
    ]);

    return ok(items, { page, limit, total });
  }),
);
