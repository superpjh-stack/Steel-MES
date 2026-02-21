import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok } from '@/lib/api/api-response';

export const GET = withAuth(async (_req: NextRequest) => {
  const materials = await prisma.material.findMany({
    where: {
      originCountry: { not: null },
    },
    select: {
      id: true,
      code: true,
      name: true,
      spec: true,
      originCountry: true,
      allergenFlag: true,
      isOrganic: true,
      supplier: true,
      expiryDays: true,
      storageTemp: true,
    },
    orderBy: [
      { originCountry: 'asc' },
      { name: 'asc' },
    ],
  });
  return ok(materials);
});
