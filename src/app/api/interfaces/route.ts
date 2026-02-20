import { NextRequest, NextResponse } from 'next/server';
// NextResponse used for 201 response below
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError, AnyHandler } from '@/lib/api/with-error-handler';
import { ok } from '@/lib/api/api-response';

const CreateSchema = z.object({
  name:        z.string().min(1, '장치명을 입력하세요.'),
  devType:     z.string().min(1),
  protocol:    z.string().min(1),
  host:        z.string().optional().nullable(),
  port:        z.number().int().min(1).max(65535).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive:    z.boolean().default(true),
});

async function getHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const devices = await prisma.interfaceDevice.findMany({
    orderBy: [{ devType: 'asc' }, { name: 'asc' }],
  });
  return ok(devices);
}

async function postHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0]?.message ?? '입력값 오류', 'VALIDATION_ERROR');
  }
  const device = await prisma.interfaceDevice.create({ data: parsed.data });
  return NextResponse.json({ success: true, data: device }, { status: 201 });
}

export const GET  = withErrorHandler(withAuth(getHandler,  ['admin', 'manager', 'supervisor']) as AnyHandler);
export const POST = withErrorHandler(withAuth(postHandler, ['admin']) as AnyHandler);
