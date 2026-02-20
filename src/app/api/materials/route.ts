import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  code:        z.string().min(1),
  name:        z.string().min(1),
  unit:        z.string().default('KG'),
  spec:        z.string().optional(),
  supplier:    z.string().optional(),
  safetyStock: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';

  const items = await prisma.material.findMany({
    where: search ? { OR: [{ name: { contains: search } }, { code: { contains: search } }] } : {},
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

  const material = await prisma.material.create({ data: parsed.data });
  return NextResponse.json(material, { status: 201 });
}
