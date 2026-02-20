import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = parseInt(searchParams.get('page')  ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '30');

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where: { resource: { in: ['SalesOrder', 'sales_orders'] } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.systemLog.count({
      where: { resource: { in: ['SalesOrder', 'sales_orders'] } },
    }),
  ]);

  return NextResponse.json({ data: logs, total, page, limit });
}
