import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  status: z.enum(['planned', 'packed', 'shipped', 'delivered']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['supervisor', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === 'shipped' || parsed.data.status === 'delivered') {
    updateData.actualDate = new Date();
  }

  const shipment = await prisma.shipment.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(shipment);
}
