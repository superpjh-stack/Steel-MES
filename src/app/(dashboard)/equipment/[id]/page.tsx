import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import OeeGauge from '@/components/charts/OeeGauge';
import EquipStatusActions from './EquipStatusActions';

interface Props { params: { id: string } }

async function getEquipment(id: string) {
  return prisma.equipment.findUnique({
    where: { id },
    include: {
      maintenances: {
        include: { technician: { select: { name: true } } },
        orderBy: { startTime: 'desc' },
        take: 10,
      },
      equipmentLogs: {
        orderBy: { logDate: 'desc' },
        take: 7,
      },
    },
  });
}

type EquipLog = NonNullable<Awaited<ReturnType<typeof getEquipment>>>['equipmentLogs'];

function calcOee(logs: EquipLog) {
  if (!logs || logs.length === 0) return { availability: 0, performance: 0, quality: 0, oee: 0 };
  const totals = logs.reduce(
    (acc: { planned: number; available: number; actualQty: number; plannedQty: number; goodQty: number }, log) => ({
      planned:    acc.planned    + log.plannedTimeMin,
      available:  acc.available  + (log.plannedTimeMin - log.breakdownMin - log.setupMin),
      actualQty:  acc.actualQty  + log.actualQty,
      plannedQty: acc.plannedQty + log.plannedQty,
      goodQty:    acc.goodQty    + log.goodQty,
    }),
    { planned: 0, available: 0, actualQty: 0, plannedQty: 0, goodQty: 0 }
  );
  const avail = totals.planned > 0 ? (totals.available / totals.planned) * 100 : 0;
  const perf  = totals.plannedQty > 0 ? Math.min((totals.actualQty / totals.plannedQty) * 100, 100) : 0;
  const qual  = totals.actualQty > 0 ? (totals.goodQty / totals.actualQty) * 100 : 0;
  return {
    availability: Math.round(avail * 10) / 10,
    performance:  Math.round(perf  * 10) / 10,
    quality:      Math.round(qual  * 10) / 10,
    oee:          Math.round(avail * perf * qual / 10000 * 10) / 10,
  };
}

const MAINT_LABEL: Record<string, string> = { preventive: '예방', corrective: '수리', emergency: '긴급' };
const MAINT_COLOR: Record<string, string> = {
  preventive: 'text-blue-600', corrective: 'text-yellow-600', emergency: 'text-red-600',
};

export default async function EquipmentDetailPage({ params }: Props) {
  const session = await auth();
  const eq = await getEquipment(params.id);
  if (!eq) notFound();

  const role = (session?.user as any)?.role ?? '';
  const oee  = calcOee(eq.equipmentLogs);

  const nextPmDate = eq.pmCycleDays && eq.lastPmDate
    ? new Date(eq.lastPmDate.getTime() + eq.pmCycleDays * 24 * 60 * 60 * 1000)
    : null;
  const pmDaysLeft = nextPmDate
    ? Math.ceil((nextPmDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/equipment" className="text-sm text-gray-400 hover:text-gray-600">← 설비 목록</Link>
          <h2 className="text-xl font-bold text-gray-800 mt-1">{eq.name}</h2>
          <p className="text-gray-500 text-sm">{eq.code} · {eq.type} · {eq.location}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge value={eq.status} type="equipment" />
          {['me', 'supervisor', 'manager', 'admin'].includes(role) && (
            <EquipStatusActions equipmentId={eq.id} currentStatus={eq.status} />
          )}
        </div>
      </div>

      {/* 기본 정보 + OEE */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold text-gray-700">기본 정보</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: '설비코드',   value: eq.code },
              { label: '유형',       value: eq.type },
              { label: '위치',       value: eq.location ?? '-' },
              { label: '제조사',     value: eq.manufacturer ?? '-' },
              { label: '설치일',     value: eq.installDate ? new Date(eq.installDate).toLocaleDateString('ko-KR') : '-' },
              { label: 'PM 주기',    value: eq.pmCycleDays ? `${eq.pmCycleDays}일` : '-' },
              { label: '최근 PM',    value: eq.lastPmDate ? new Date(eq.lastPmDate).toLocaleDateString('ko-KR') : '-' },
              { label: '다음 PM',    value: nextPmDate ? `${nextPmDate.toLocaleDateString('ko-KR')} (${pmDaysLeft}일 후)` : '-' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-gray-800 mt-0.5 ${label === '다음 PM' && pmDaysLeft !== null && pmDaysLeft <= 7 ? 'text-red-600 font-semibold' : ''}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* OEE 게이지 */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-semibold text-gray-700 mb-3">OEE (최근 7일)</h3>
          {eq.equipmentLogs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">가동 기록이 없습니다.</p>
          ) : (
            <OeeGauge {...oee} />
          )}
        </div>
      </div>

      {/* 보전 이력 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">보전 이력 ({eq.maintenances.length}건)</h3>
          <Link href="/equipment/maintenance" className="text-xs text-blue-600 hover:underline">전체 보기</Link>
        </div>
        {eq.maintenances.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">보전 이력이 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['유형', '내용', '기술자', '시작', '종료', '비용'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {eq.maintenances.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className={`px-4 py-2.5 font-medium text-xs ${MAINT_COLOR[m.type]}`}>{MAINT_LABEL[m.type]}</td>
                  <td className="px-4 py-2.5 text-gray-700 max-w-xs truncate">{m.description}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.technician.name}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(m.startTime).toLocaleDateString('ko-KR')}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{m.endTime ? new Date(m.endTime).toLocaleDateString('ko-KR') : '-'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.cost ? `₩${Number(m.cost).toLocaleString()}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
