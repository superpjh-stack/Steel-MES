import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok, created, fail } from '@/lib/api/api-response';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = req.nextUrl;
  const productId = searchParams.get('productId');
  const status    = searchParams.get('status');

  const recipes = await prisma.recipe.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(status    ? { status }    : {}),
    },
    include: {
      product: { select: { code: true, name: true, category: true } },
      ingredients: {
        include: { material: { select: { code: true, name: true, unit: true } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: [{ product: { name: 'asc' } }, { version: 'desc' }],
  });
  return ok(recipes);
});

export const POST = withAuth(
  async (req: NextRequest, _ctx, user) => {
    const body = await req.json();
    const { productId, version, batchSizeKg, status, notes, ingredients } = body;

    if (!productId || !batchSizeKg) {
      return fail(400, 'BAD_REQUEST', 'productId, batchSizeKg는 필수입니다.');
    }

    const recipe = await prisma.recipe.create({
      data: {
        productId,
        version: version ?? '1.0',
        batchSizeKg: Number(batchSizeKg),
        status: status ?? 'draft',
        notes: notes ?? null,
        createdById: user.id,
        ingredients: {
          create: (ingredients ?? []).map((ing: { materialId: string; ratio: number; amountKg: number; sortOrder?: number; notes?: string }) => ({
            materialId: ing.materialId,
            ratio:      Number(ing.ratio),
            amountKg:   Number(ing.amountKg),
            sortOrder:  ing.sortOrder ?? 0,
            notes:      ing.notes ?? null,
          })),
        },
      },
      include: {
        product:     { select: { code: true, name: true } },
        ingredients: { include: { material: { select: { code: true, name: true, unit: true } } } },
      },
    });
    return created(recipe);
  },
  ['admin', 'manager', 'supervisor'],
);
