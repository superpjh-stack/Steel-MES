import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');   // 'material' | 'product'
  const status = searchParams.get('status'); // 'available' | 'reserved' | 'quarantine'

  const where = {
    ...(type === 'material' ? { materialId: { not: null }, productId: null } : {}),
    ...(type === 'product'  ? { productId:  { not: null }, materialId: null } : {}),
    ...(status ? { status } : {}),
  };

  const items = await prisma.inventory.findMany({
    where,
    include: {
      material: { select: { name: true, code: true, unit: true, safetyStock: true } },
      product:  { select: { name: true, code: true, unit: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(items);
}
