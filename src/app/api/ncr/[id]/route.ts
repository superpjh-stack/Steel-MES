import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.nonconformanceReport.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

const updateSchema = z.object({
  status:      z.enum(['open', 'under_review', 'approved', 'closed']).optional(),
  disposition: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['qc', 'supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === 'approved') {
    data.approverId  = (session.user as any).id;
    data.approvedAt  = new Date();
  }

  const ncr = await prisma.nonconformanceReport.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(ncr);
}
