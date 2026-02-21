import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/api/with-auth';
import { ok } from '@/lib/api/api-response';

export const GET = withAuth(async (_req: NextRequest) => {
  const allergens = await prisma.allergenCode.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });
  return ok(allergens);
});
