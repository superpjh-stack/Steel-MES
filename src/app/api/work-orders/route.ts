import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { withErrorHandler } from '@/lib/api/with-error-handler';
import { ok, created, fail, parsePagination } from '@/lib/api/api-response';
import { generateWoNo } from '@/lib/services/sequence.service';
type WoStatus = 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled';

const createSchema = z.object({
  productId:    z.string().uuid(),
  customerId:   z.string().uuid(),
  plannedQty:   z.number().int().positive(),
  plannedStart: z.string().datetime(),
  plannedEnd:   z.string().datetime(),
  dueDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'dueDate must be YYYY-MM-DD'),
  priority:     z.number().int().min(1).max(10).default(5),
  notes:        z.string().optional(),
});

export const GET = withErrorHandler(
  withAuth(async (req: NextRequest) => {
    const url    = new URL(req.url);
    const status = url.searchParams.get('status') as WoStatus | null;
    const { page, limit, skip } = parsePagination(url);

    const where = status ? { status } : {};

    const [items, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          product:  { select: { name: true, code: true } },
          customer: { select: { name: true } },
        },
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return ok(items, { page, limit, total });
  }),
);

export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten());
    }

    const woNo = await generateWoNo();
    const wo = await prisma.workOrder.create({
      data: {
        ...parsed.data,
        woNo,
        dueDate:      new Date(parsed.data.dueDate),
        plannedStart: new Date(parsed.data.plannedStart),
        plannedEnd:   new Date(parsed.data.plannedEnd),
        createdById:  user.id,
      },
      include: {
        product:  { select: { name: true } },
        customer: { select: { name: true } },
      },
    });

    return created(wo);
  }, ['supervisor', 'manager', 'admin']),
);
