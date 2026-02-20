import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 자재 재고가 안전재고 이하인 항목
  const inventories = await prisma.inventory.findMany({
    where: { materialId: { not: null } },
    include: { material: { select: { name: true, code: true, unit: true, safetyStock: true } } },
  });

  const alerts = inventories
    .filter((inv) => {
      if (!inv.material) return false;
      return Number(inv.qty) <= Number(inv.material.safetyStock);
    })
    .map((inv) => ({
      id:          inv.id,
      materialCode: inv.material!.code,
      materialName: inv.material!.name,
      unit:         inv.material!.unit,
      currentQty:   Number(inv.qty),
      safetyStock:  Number(inv.material!.safetyStock),
      shortage:     Number(inv.material!.safetyStock) - Number(inv.qty),
      location:     inv.location,
      status:       inv.status,
    }))
    .sort((a, b) => b.shortage - a.shortage);

  return NextResponse.json(alerts);
}
