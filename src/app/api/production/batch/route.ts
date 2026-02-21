import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok } from '@/lib/api/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');

  const workOrders = await prisma.workOrder.findMany({
    where: {
      ...(status ? { status } : {}),
    },
    include: {
      product: {
        include: {
          recipes: {
            where: { status: 'approved' },
            take: 1,
            select: { id: true, version: true, batchSizeKg: true },
          },
        },
      },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const batches = workOrders.map((wo) => {
    const recipe = wo.product.recipes[0] ?? null;
    return {
      id: wo.id,
      woNumber: wo.woNo,
      productName: wo.product.name,
      productCategory: wo.product.category,
      customerName: wo.customer.name,
      plannedQty: wo.plannedQty,
      actualQty: wo.producedQty,
      defectQty: wo.defectQty,
      status: wo.status,
      startDate: wo.plannedStart,
      endDate: wo.plannedEnd,
      actualStart: wo.actualStart,
      actualEnd: wo.actualEnd,
      dueDate: wo.dueDate,
      recipeVersion: recipe?.version ?? null,
      batchSizeKg: recipe?.batchSizeKg ?? null,
    };
  });

  return ok(batches);
});
