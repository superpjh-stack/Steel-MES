import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logs = await prisma.equipmentLog.findMany({
    where: { equipmentId: params.id },
    orderBy: { logDate: 'desc' },
    take: 30,
  });

  const oeeData = logs.map((log) => {
    const availableTime = log.plannedTimeMin - log.breakdownMin - log.setupMin;
    const availability = log.plannedTimeMin > 0 ? availableTime / log.plannedTimeMin : 0;
    const performance = log.actualTimeMin > 0 && log.actualQty > 0
      ? Math.min(log.actualQty / log.plannedQty, 1)
      : 0;
    const quality = log.actualQty > 0 ? log.goodQty / log.actualQty : 0;
    const oee = availability * performance * quality;

    return {
      date: log.logDate,
      shift: log.shift,
      availability: Math.round(availability * 1000) / 10,
      performance: Math.round(performance * 1000) / 10,
      quality: Math.round(quality * 1000) / 10,
      oee: Math.round(oee * 1000) / 10,
    };
  });

  return NextResponse.json(oeeData);
}
