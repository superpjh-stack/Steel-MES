import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError, AnyHandler } from '@/lib/api/with-error-handler';
import { ok } from '@/lib/api/api-response';

const CreateSchema = z.object({
  salesOrderId: z.string().uuid(),
  category: z.enum(['viscosity', 'pressure', 'vacuum', 'corrosion', 'temperature', 'other']),
  item:  z.string().min(1).max(100),
  value: z.string().min(1).max(200),
  unit:  z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function getHandler(req: NextRequest, _ctx: any, _user: AuthenticatedUser) {
  const soId = req.nextUrl.searchParams.get('salesOrderId');
  const reqs = await prisma.customerRequirement.findMany({
    where: soId ? { salesOrderId: soId } : undefined,
    include: { salesOrder: { select: { soNo: true, customer: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(reqs);
}

async function postHandler(req: NextRequest, _ctx: any, user: AuthenticatedUser) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값 오류', 'VALIDATION_ERROR');

  const req_ = await prisma.customerRequirement.create({
    data: { ...parsed.data, createdById: user.id },
  });
  return NextResponse.json({ success: true, data: req_ }, { status: 201 });
}

async function deleteHandler(req: NextRequest, _ctx: any, _user: AuthenticatedUser) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) throw new AppError(400, 'id 파라미터가 필요합니다.', 'BAD_REQUEST');
  await prisma.customerRequirement.delete({ where: { id } });
  return ok({ deleted: true });
}

export const GET    = withErrorHandler(withAuth(getHandler,    ['admin', 'manager', 'supervisor']) as AnyHandler);
export const POST   = withErrorHandler(withAuth(postHandler,   ['admin', 'manager', 'supervisor']) as AnyHandler);
export const DELETE = withErrorHandler(withAuth(deleteHandler, ['admin', 'manager']) as AnyHandler);
