import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WorkStartClient from './WorkStartClient';

interface Props {
  params: { woId: string };
}

export default async function WorkStartPage({ params }: Props) {
  const session = await auth();

  const wo = await prisma.workOrder.findUnique({
    where: { id: params.woId },
    include: {
      product:  { select: { name: true, code: true, stdCycleSec: true } },
      customer: { select: { name: true } },
    },
  });

  if (!wo || !['issued', 'in_progress'].includes(wo.status)) notFound();

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold">작업 시작</h2>
      <div className="bg-gray-700 rounded-xl p-4">
        <p className="font-mono text-blue-300 text-sm">{wo.woNo}</p>
        <p className="font-bold text-lg text-white mt-1">{wo.product.name}</p>
        <p className="text-gray-400 text-sm">{wo.customer.name}</p>
        <p className="text-gray-400 text-sm mt-2">
          목표 <strong className="text-white">{wo.plannedQty.toLocaleString()} EA</strong>
          {wo.product.stdCycleSec && (
            <span className="ml-3">표준 사이클 <strong className="text-white">{wo.product.stdCycleSec}초</strong></span>
          )}
        </p>
      </div>
      <WorkStartClient woId={wo.id} currentStatus={wo.status} />
    </div>
  );
}
