import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  productionLogId: z.string().uuid().optional(),
  inspectionId:    z.string().uuid().optional(),
  defectCode:      z.string().min(1),
  defectName:      z.string().min(1),
  qty:             z.number().int().positive(),
  disposition:     z.enum(['rework', 'scrap', 'use_as_is', 'return']),
  rootCause:       z.string().optional(),
  correctiveAction: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const defect = await prisma.defectLog.create({
    data: {
      ...parsed.data,
      createdById: (session.user as any).id,
    },
  });

  return NextResponse.json(defect, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const defectCode     = searchParams.get('defectCode');
  const disposition    = searchParams.get('disposition');
  const page           = parseInt(searchParams.get('page')  ?? '1');
  const limit          = parseInt(searchParams.get('limit') ?? '30');

  const where = {
    ...(defectCode  ? { defectCode }  : {}),
    ...(disposition ? { disposition: disposition as any } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.defectLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.defectLog.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
