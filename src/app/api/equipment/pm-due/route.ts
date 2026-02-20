import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();

  // PM 주기가 설정된 설비 중 도래일이 오늘로부터 7일 이내거나 이미 초과된 설비
  const equipment = await prisma.equipment.findMany({
    where: {
      pmCycleDays: { not: null },
      status: { not: 'breakdown' },
    },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      location: true,
      status: true,
      pmCycleDays: true,
      lastPmDate: true,
    },
  });

  const pmDue = equipment
    .map((eq) => {
      if (!eq.pmCycleDays || !eq.lastPmDate) return null;
      const nextPmDate = new Date(eq.lastPmDate.getTime() + eq.pmCycleDays * 24 * 60 * 60 * 1000);
      const daysLeft   = Math.ceil((nextPmDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return { ...eq, nextPmDate, daysLeft };
    })
    .filter((eq): eq is NonNullable<typeof eq> => eq !== null && eq.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return NextResponse.json(pmDue);
}
