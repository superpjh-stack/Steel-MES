import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()));
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1));

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  const orders = await prisma.salesOrder.findMany({
    where: { dueDate: { gte: from, lte: to } },
    include: {
      customer: { select: { name: true } },
      product:  { select: { name: true, code: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  return NextResponse.json({ data: orders, year, month });
}
