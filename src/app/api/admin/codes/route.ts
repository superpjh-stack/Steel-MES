import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedUser } from '@/lib/api/with-auth';
import { withErrorHandler, AppError, AnyHandler } from '@/lib/api/with-error-handler';
import { ok } from '@/lib/api/api-response';

const CreateSchema = z.object({
  groupCode:   z.string().min(1).max(50),
  groupName:   z.string().min(1).max(100),
  code:        z.string().min(1).max(50),
  codeName:    z.string().min(1).max(100),
  sortOrder:   z.number().int().default(0),
  isActive:    z.boolean().default(true),
  description: z.string().optional().nullable(),
});

async function getHandler(
  req: NextRequest,
  ctx: { params: Record<string, string> },
  _user: AuthenticatedUser,
) {
  const groupCode = req.nextUrl.searchParams.get('groupCode');
  const codes = await prisma.commonCode.findMany({
    where:   groupCode ? { groupCode } : undefined,
    orderBy: [{ groupCode: 'asc' }, { sortOrder: 'asc' }, { code: 'asc' }],
  });
  return ok(codes);
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
  const code = await prisma.commonCode.create({ data: parsed.data });
  return NextResponse.json({ success: true, data: code }, { status: 201 });
}

export const GET  = withErrorHandler(withAuth(getHandler,  ['admin', 'manager', 'supervisor']) as AnyHandler);
export const POST = withErrorHandler(withAuth(postHandler, ['admin']) as AnyHandler);
