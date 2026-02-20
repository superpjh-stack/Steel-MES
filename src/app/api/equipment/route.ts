import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  code:         z.string().min(1),
  name:         z.string().min(1),
  type:         z.string().min(1),
  location:     z.string().optional(),
  manufacturer: z.string().optional(),
  installDate:  z.string().optional(),
  pmCycleDays:  z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const type   = searchParams.get('type');

  const items = await prisma.equipment.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(type   ? { type } : {}),
    },
    orderBy: { code: 'asc' },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role;
  if (!['manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const equipment = await prisma.equipment.create({
    data: {
      ...parsed.data,
      installDate: parsed.data.installDate ? new Date(parsed.data.installDate) : undefined,
    },
  });

  return NextResponse.json(equipment, { status: 201 });
}
