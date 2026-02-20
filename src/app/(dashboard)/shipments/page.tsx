import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import StatusBadge from '@/components/ui/StatusBadge';
import Link from 'next/link';

export default async function ShipmentsPage() {
  await auth();

  const shipments = await prisma.shipment.findMany({
    include: {
      customer: { select: { name: true, code: true } },
      product:  { select: { name: true, code: true, unit: true } },
      workOrder: { select: { woNo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const total     = shipments.length;
  const planned   = shipments.filter((s) => s.status === 'planned').length;
  const shipped   = shipments.filter((s) => s.status === 'shipped').length;
  const delivered = shipments.filter((s) => s.status === 'delivered').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">출하 관리</h2>
        <Link href="/shipments/delivery-status" className="text-sm text-blue-600 hover:underline">
          납기 현황 →
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '전체',  value: total,     color: 'bg-gray-100 text-gray-700' },
          { label: '예정',  value: planned,   color: 'bg-yellow-100 text-yellow-700' },
          { label: '출하중', value: shipped,  color: 'bg-blue-100 text-blue-700' },
          { label: '도착',  value: delivered, color: 'bg-green-100 text-green-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-lg p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* 출하 목록 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['출하번호', '고객사', '품목', '로트번호', '출하수량', '단위', '예정일', '실제일', '상태'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shipments.map((s) => {
              const isOverdue = s.status === 'planned' && new Date(s.plannedDate) < new Date();
              return (
                <tr key={s.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{s.shipmentNo}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{s.customer.name}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-gray-800">{s.product.name}</p>
                    <p className="text-xs font-mono text-gray-400">{s.product.code}</p>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.lotNo ?? '-'}</td>
                  <td className="px-4 py-2.5 font-bold text-gray-800">{s.shippedQty.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.product.unit}</td>
                  <td className={`px-4 py-2.5 text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {new Date(s.plannedDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {s.actualDate ? new Date(s.actualDate).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={s.status} type="shipment" />
                  </td>
                </tr>
              );
            })}
            {shipments.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">출하 내역이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
