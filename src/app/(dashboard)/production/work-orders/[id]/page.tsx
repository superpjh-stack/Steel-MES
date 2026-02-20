import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import WoStatusActions from './WoStatusActions';

interface Props {
  params: { id: string };
}

async function getWorkOrder(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: {
      product:  { select: { name: true, code: true, unit: true, stdCycleSec: true } },
      customer: { select: { name: true, code: true } },
      createdBy: { select: { name: true } },
      productionLogs: {
        include: {
          process:   { select: { name: true, code: true } },
          equipment: { select: { name: true, code: true } },
          operator:  { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
      inspections: {
        include: { inspector: { select: { name: true } } },
        orderBy: { inspectionDate: 'desc' },
        take: 10,
      },
    },
  });
}

export default async function WorkOrderDetailPage({ params }: Props) {
  const session = await auth();
  const wo = await getWorkOrder(params.id);
  if (!wo) notFound();

  const role = (session?.user as any)?.role ?? '';
  const rate = wo.plannedQty > 0 ? Math.round((wo.producedQty / wo.plannedQty) * 100) : 0;
  const defectRate = (wo.producedQty + wo.defectQty) > 0
    ? ((wo.defectQty / (wo.producedQty + wo.defectQty)) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/production/work-orders" className="text-sm text-gray-400 hover:text-gray-600">← 목록</Link>
          </div>
          <h2 className="text-xl font-bold text-gray-800 font-mono">{wo.woNo}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{wo.product.name} · {wo.customer.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={wo.status} type="wo" />
          {['supervisor', 'manager', 'admin'].includes(role) && (
            <WoStatusActions woId={wo.id} currentStatus={wo.status as 'draft' | 'issued' | 'in_progress' | 'completed' | 'cancelled'} />
          )}
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="계획 수량" value={`${wo.plannedQty.toLocaleString()} ${wo.product.unit}`} />
        <InfoCard label="생산 실적" value={`${wo.producedQty.toLocaleString()} (${rate}%)`} color="green" />
        <InfoCard label="불량 수량" value={`${wo.defectQty.toLocaleString()} (${defectRate}%)`} color={parseFloat(defectRate) > 2 ? 'red' : 'gray'} />
        <InfoCard label="납기일" value={new Date(wo.dueDate).toLocaleDateString('ko-KR')} color={new Date(wo.dueDate) < new Date() ? 'red' : 'gray'} />
      </div>

      {/* 진행률 바 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>달성률</span>
          <span className="font-bold">{rate}%</span>
        </div>
        <div className="bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${rate >= 90 ? 'bg-green-500' : rate >= 50 ? 'bg-blue-500' : 'bg-gray-400'}`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-3">기본 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Field label="품목코드" value={wo.product.code} />
          <Field label="고객사" value={`${wo.customer.name} (${wo.customer.code})`} />
          <Field label="우선순위" value={String(wo.priority)} />
          <Field label="계획 시작" value={new Date(wo.plannedStart).toLocaleString('ko-KR')} />
          <Field label="계획 종료" value={new Date(wo.plannedEnd).toLocaleString('ko-KR')} />
          <Field label="생성자" value={wo.createdBy.name} />
          {wo.actualStart && <Field label="실제 시작" value={new Date(wo.actualStart).toLocaleString('ko-KR')} />}
          {wo.actualEnd && <Field label="실제 종료" value={new Date(wo.actualEnd).toLocaleString('ko-KR')} />}
          {wo.notes && <Field label="비고" value={wo.notes} className="col-span-2" />}
        </div>
      </div>

      {/* 생산 실적 로그 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">생산 실적 ({wo.productionLogs.length}건)</h3>
        </div>
        {wo.productionLogs.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">생산 실적이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['로트번호', '공정', '설비', '양품', '불량', '작업자', '일시'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wo.productionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{log.lotNo}</td>
                  <td className="px-3 py-2">{log.process.name}</td>
                  <td className="px-3 py-2 text-gray-600">{log.equipment.name}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold">{log.goodQty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-red-500">{log.defectQty.toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-600">{log.operator.name}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {new Date(log.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 검사 기록 */}
      {wo.inspections.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">검사 기록 ({wo.inspections.length}건)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['유형', '로트번호', '샘플', '합격', '불합격', '판정', '검사자', '일시'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {wo.inspections.map((ins) => (
                <tr key={ins.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">{ins.type === 'incoming' ? '수입' : ins.type === 'in_process' ? '공정' : '출하'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{ins.lotNo}</td>
                  <td className="px-3 py-2">{ins.sampleQty}</td>
                  <td className="px-3 py-2 text-green-600">{ins.passQty}</td>
                  <td className="px-3 py-2 text-red-500">{ins.failQty}</td>
                  <td className="px-3 py-2">
                    <StatusBadge value={ins.result} type="inspection" />
                  </td>
                  <td className="px-3 py-2 text-gray-600">{ins.inspector.name}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs">
                    {new Date(ins.inspectionDate).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, color = 'gray' }: { label: string; value: string; color?: string }) {
  const c = color === 'green' ? 'text-green-700 bg-green-50 border-green-200'
    : color === 'red' ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-gray-700 bg-gray-50 border-gray-200';
  return (
    <div className={`rounded-lg border p-3 ${c}`}>
      <p className="text-xs opacity-60">{label}</p>
      <p className="font-bold mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
