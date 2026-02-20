import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductionInput from '@/components/operator/ProductionInput';

interface Props {
  params: { woId: string };
}

export default async function ProductionInputPage({ params }: Props) {
  await auth();

  const wo = await prisma.workOrder.findUnique({
    where: { id: params.woId },
    include: {
      product:  { select: { name: true, code: true, unit: true } },
      customer: { select: { name: true } },
    },
  });

  if (!wo || !['issued', 'in_progress'].includes(wo.status)) notFound();

  const equipment = await prisma.equipment.findMany({
    where: { status: 'running' },
    select: { id: true, name: true, code: true },
    orderBy: { code: 'asc' },
  });

  // product에 연결된 공정 또는 전체 공정
  const processes = await prisma.process.findMany({
    where: { OR: [{ productId: wo.productId }, { productId: null }] },
    select: { id: true, name: true, code: true },
    orderBy: { seq: 'asc' },
  });

  return (
    <ProductionInput
      woId={wo.id}
      woNo={wo.woNo}
      productName={wo.product.name}
      plannedQty={wo.plannedQty}
      producedQty={wo.producedQty}
      processes={processes}
      equipment={equipment}
    />
  );
}
