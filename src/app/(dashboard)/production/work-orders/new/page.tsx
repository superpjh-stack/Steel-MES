import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import WorkOrderForm from './WorkOrderForm';

export default async function NewWorkOrderPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { code: 'asc' },
    }),
    prisma.customer.findMany({ orderBy: { code: 'asc' } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/production/work-orders"
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← 작업지시 목록
        </Link>
      </div>
      <h2 className="text-xl font-bold text-gray-800">작업지시 등록</h2>

      <WorkOrderForm products={products} customers={customers} />
    </div>
  );
}
