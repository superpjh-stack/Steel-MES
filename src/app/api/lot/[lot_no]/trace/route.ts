import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { lot_no: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const lotNo = decodeURIComponent(params.lot_no);

  const lot = await prisma.lotTraceability.findUnique({
    where: { lotNo },
    include: {
      material:  { select: { name: true, code: true, unit: true } },
      workOrder: {
        include: {
          product:  { select: { name: true, code: true } },
          customer: { select: { name: true } },
          productionLogs: {
            include: {
              process:   { select: { name: true, code: true } },
              equipment: { select: { name: true, code: true } },
              operator:  { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
          },
          inspections: {
            include: { inspector: { select: { name: true } } },
            orderBy: { inspectionDate: 'asc' },
          },
        },
      },
      product: { select: { name: true, code: true } },
    },
  });

  if (!lot) return NextResponse.json({ error: 'Lot not found' }, { status: 404 });

  // 출하 이력
  const shipment = await prisma.shipment.findFirst({
    where: { lotNo },
    include: { customer: { select: { name: true } } },
  });

  return NextResponse.json({ lot, shipment });
}
