import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import StatusBadge from '@/components/ui/StatusBadge';

interface Props { params: { lot_no: string } }

export default async function LotTracePage({ params }: Props) {
  await auth();
  const lotNo = decodeURIComponent(params.lot_no);

  const lot = await prisma.lotTraceability.findUnique({
    where: { lotNo },
    include: {
      material:  { select: { name: true, code: true, unit: true } },
      workOrder: {
        include: {
          product:  { select: { name: true, code: true } },
          customer: { select: { name: true } },
          productionLogs: {
            include: {
              process:   { select: { name: true, code: true } },
              equipment: { select: { name: true, code: true } },
              operator:  { select: { name: true } },
            },
            orderBy: { startTime: 'asc' },
          },
        },
      },
      product: { select: { name: true, code: true } },
    },
  });

  if (!lot) notFound();

  const shipment = await prisma.shipment.findFirst({
    where: { lotNo },
    include: { customer: { select: { name: true } } },
  });

  const LOT_STATUS: Record<string, string> = { wip: '진행중', finished: '완료', shipped: '출하', scrapped: '폐기' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">로트 추적</h2>
        <p className="font-mono text-blue-600 text-lg mt-1">{lot.lotNo}</p>
      </div>

      {/* 로트 기본 정보 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">로트 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Field label="로트번호"   value={lot.lotNo} mono />
          <Field label="제품"       value={`${lot.product.name} (${lot.product.code})`} />
          <Field label="수량"       value={`${Number(lot.qty).toLocaleString()}`} />
          <Field label="상태"       value={LOT_STATUS[lot.status] ?? lot.status} />
          {lot.material && <Field label="원자재" value={`${lot.material.name} (${lot.material.code})`} />}
          {lot.materialLot && <Field label="원자재 로트" value={lot.materialLot} mono />}
          <Field label="작업지시" value={lot.workOrder.woNo} mono />
          <Field label="고객사"   value={lot.workOrder.customer.name} />
          <Field label="생성일"   value={new Date(lot.createdAt).toLocaleString('ko-KR')} />
        </div>
      </div>

      {/* 생산 이력 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">공정 이력 ({lot.workOrder.productionLogs.length}건)</h3>
        </div>
        {lot.workOrder.productionLogs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">생산 기록이 없습니다.</p>
        ) : (
          <ol className="divide-y divide-gray-100">
            {lot.workOrder.productionLogs.map((log, i) => (
              <li key={log.id} className="px-4 py-3 flex items-start gap-4">
                <span className="bg-blue-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><p className="text-xs text-gray-400">공정</p><p className="font-medium">{log.process.name}</p></div>
                  <div><p className="text-xs text-gray-400">설비</p><p>{log.equipment.name}</p></div>
                  <div><p className="text-xs text-gray-400">작업자</p><p>{log.operator.name}</p></div>
                  <div>
                    <p className="text-xs text-gray-400">실적</p>
                    <p><span className="text-green-600 font-semibold">{log.goodQty}</span> / <span className="text-red-500">{log.defectQty}</span></p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 출하 정보 */}
      {shipment && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">출하 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="출하번호"   value={shipment.shipmentNo} mono />
            <Field label="고객사"     value={shipment.customer.name} />
            <Field label="출하 수량"  value={shipment.shippedQty.toLocaleString()} />
            <div>
              <p className="text-xs text-gray-400">상태</p>
              <StatusBadge value={shipment.status} type="shipment" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-gray-800 mt-0.5 ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
    </div>
  );
}
