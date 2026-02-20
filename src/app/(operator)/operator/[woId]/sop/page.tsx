import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: { woId: string };
}

export default async function SopPage({ params }: Props) {
  await auth();

  const wo = await prisma.workOrder.findUnique({
    where: { id: params.woId },
    include: {
      product: {
        select: {
          name: true,
          code: true,
          drawingNo: true,
          stdCycleSec: true,
          processes: {
            include: { equipment: { select: { name: true, code: true } } },
            orderBy: { seq: 'asc' },
          },
        },
      },
    },
  });

  if (!wo) notFound();

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/operator/${wo.id}/input`} className="text-gray-400 hover:text-white text-sm">← 실적 입력</Link>
        <h2 className="text-lg font-bold">작업 표준서</h2>
      </div>

      <div className="bg-gray-700 rounded-xl p-4">
        <p className="font-mono text-blue-300 text-xs">{wo.woNo}</p>
        <p className="font-bold text-lg text-white mt-1">{wo.product.name}</p>
        {wo.product.drawingNo && (
          <p className="text-gray-400 text-sm mt-1">도면번호: {wo.product.drawingNo}</p>
        )}
        {wo.product.stdCycleSec && (
          <p className="text-gray-400 text-sm">표준 사이클타임: {wo.product.stdCycleSec}초</p>
        )}
      </div>

      {/* 공정 순서 */}
      <div className="bg-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3">공정 순서</h3>
        {wo.product.processes.length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 공정이 없습니다.</p>
        ) : (
          <ol className="space-y-3">
            {wo.product.processes.map((p, i) => (
              <li key={p.id} className="flex items-start gap-3">
                <span className="bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <p className="text-white font-medium">{p.name}</p>
                  <p className="text-gray-400 text-sm font-mono">{p.code}</p>
                  {p.equipment && (
                    <p className="text-gray-400 text-xs mt-0.5">
                      설비: {p.equipment.name} ({p.equipment.code})
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-yellow-900/40 border border-yellow-700 rounded-xl p-4">
        <p className="text-yellow-400 text-sm font-semibold">⚠ 안전 주의사항</p>
        <ul className="text-yellow-200 text-xs mt-2 space-y-1">
          <li>• 작업 전 반드시 안전장구(장갑, 보안경)를 착용하세요.</li>
          <li>• 설비 이상 발생 시 즉시 정지 후 감독자에게 보고하세요.</li>
          <li>• 불량 발생 시 정상품과 분리하여 표시하세요.</li>
        </ul>
      </div>
    </div>
  );
}
