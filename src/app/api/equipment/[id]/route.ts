import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['running', 'stopped', 'maintenance', 'breakdown']).optional(),
  location: z.string().optional(),
  pmCycleDays: z.number().int().positive().optional(),
  lastPmDate: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['me', 'supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const equipment = await prisma.equipment.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      lastPmDate: parsed.data.lastPmDate ? new Date(parsed.data.lastPmDate) : undefined,
    },
  });

  return NextResponse.json(equipment);
}
