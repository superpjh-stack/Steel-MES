import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError, AnyHandler } from '@/lib/api/with-error-handler';
import { ok } from '@/lib/api/api-response';

const UpdateSchema = z.object({
  name:        z.string().min(1).optional(),
  devType:     z.string().min(1).optional(),
  protocol:    z.string().min(1).optional(),
  host:        z.string().optional().nullable(),
  port:        z.number().int().min(1).max(65535).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive:    z.boolean().optional(),
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
  const device = await prisma.interfaceDevice.update({
    where: { id },
    data:  parsed.data,
  });
  return ok(device);
}

async function deleteHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const { id } = ctx.params;
  await prisma.interfaceDevice.delete({ where: { id } });
  return ok(null);
}

export const PUT    = withErrorHandler(withAuth(putHandler,    ['admin']) as AnyHandler);
export const DELETE = withErrorHandler(withAuth(deleteHandler, ['admin']) as AnyHandler);
