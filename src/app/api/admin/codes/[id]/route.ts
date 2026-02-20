import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError, AnyHandler } from '@/lib/api/with-error-handler';
import { ok } from '@/lib/api/api-response';

const UpdateSchema = z.object({
  groupCode:   z.string().min(1).max(50).optional(),
  groupName:   z.string().min(1).max(100).optional(),
  code:        z.string().min(1).max(50).optional(),
  codeName:    z.string().min(1).max(100).optional(),
  sortOrder:   z.number().int().optional(),
  isActive:    z.boolean().optional(),
  description: z.string().optional().nullable(),
});

async function putHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const { id } = ctx.params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값 오류', 'VALIDATION_ERROR');
  }
  const updated = await prisma.commonCode.update({ where: { id }, data: parsed.data });
  return ok(updated);
}

async function deleteHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const { id } = ctx.params;
  await prisma.commonCode.delete({ where: { id } });
  return ok(null);
}

export const PUT    = withErrorHandler(withAuth(putHandler,    ['admin']) as AnyHandler);
export const DELETE = withErrorHandler(withAuth(deleteHandler, ['admin']) as AnyHandler);
