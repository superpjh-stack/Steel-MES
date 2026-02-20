import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wo = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      product:  { select: { name: true, code: true, unit: true, stdCycleSec: true } },
      customer: { select: { name: true, code: true } },
      createdBy: { select: { name: true } },
      productionLogs: {
        include: {
          process:  { select: { name: true, code: true } },
          equipment: { select: { name: true, code: true } },
          operator:  { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      inspections: {
        include: { inspector: { select: { name: true } } },
        orderBy: { inspectionDate: 'desc' },
        take: 10,
      },
    },
  });

  if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(wo);
}
