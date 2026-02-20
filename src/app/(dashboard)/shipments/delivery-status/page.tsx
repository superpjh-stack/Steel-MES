import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function DeliveryStatusPage() {
  await auth();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [shipments, workOrders] = await Promise.all([
    prisma.shipment.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: {
        customer: { select: { name: true, code: true } },
        product:  { select: { name: true, code: true } },
      },
      orderBy: { plannedDate: 'asc' },
    }),
    prisma.workOrder.findMany({
      where: { status: { notIn: ['completed', 'cancelled'] } },
      include: {
        customer: { select: { name: true } },
        product:  { select: { name: true, code: true } },
      },
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  // 고객사별 출하 통계
  const byCustomer = shipments.reduce<Record<string, { name: string; total: number; delivered: number; overdue: number }>>((acc, s) => {
    const key = s.customer.code;
    if (!acc[key]) acc[key] = { name: s.customer.name, total: 0, delivered: 0, overdue: 0 };
    acc[key].total++;
    if (s.status === 'delivered') acc[key].delivered++;
    if (s.status === 'planned' && new Date(s.plannedDate) < now) acc[key].overdue++;
    return acc;
  }, {});

  const customerStats = Object.values(byCustomer).sort((a, b) => b.total - a.total);

  // OTD 계산
  const completed = shipments.filter((s) => ['delivered', 'shipped'].includes(s.status));
  const onTime    = completed.filter((s) => !s.actualDate || new Date(s.actualDate) <= new Date(s.plannedDate));
  const otdRate   = completed.length > 0 ? Math.round((onTime.length / completed.length) * 100) : 100;

  const overdueShipments = shipments.filter((s) => s.status === 'planned' && new Date(s.plannedDate) < now);
  const urgentWos        = workOrders.filter((wo) => {
    const days = (new Date(wo.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return days <= 3;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">납기 현황</h2>

      {/* OTD 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'OTD율 (30일)', value: `${otdRate}%`, color: otdRate >= 95 ? 'text-green-600' : otdRate >= 80 ? 'text-yellow-600' : 'text-red-600' },
          { label: '출하 처리', value: `${completed.length}건`, color: 'text-blue-600' },
          { label: '납기 초과', value: `${overdueShipments.length}건`, color: overdueShipments.length > 0 ? 'text-red-600' : 'text-green-600' },
          { label: '긴급 WO', value: `${urgentWos.length}건`, color: urgentWos.length > 0 ? 'text-orange-600' : 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 납기 초과 출하 */}
      {overdueShipments.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-red-50">
            <h3 className="font-semibold text-red-700">납기 초과 출하 ({overdueShipments.length}건)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['출하번호', '고객사', '품목', '예정일', '초과일수'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdueShipments.map((s) => {
                const overdueDays = Math.ceil((now.getTime() - new Date(s.plannedDate).getTime()) / (24 * 60 * 60 * 1000));
                return (
                  <tr key={s.id} className="bg-red-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{s.shipmentNo}</td>
                    <td className="px-4 py-2.5 font-medium">{s.customer.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{s.product.name}</td>
                    <td className="px-4 py-2.5 text-red-600 text-xs">{new Date(s.plannedDate).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-2.5 text-red-700 font-bold">+{overdueDays}일</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 긴급 작업지시 */}
      {urgentWos.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-orange-50">
            <h3 className="font-semibold text-orange-700">3일 이내 납기 작업지시 ({urgentWos.length}건)</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['WO번호', '고객사', '품목', '납기일', '잔여일'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {urgentWos.map((wo) => {
                const daysLeft = Math.ceil((new Date(wo.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                return (
                  <tr key={wo.id} className="bg-orange-50/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{wo.woNo}</td>
                    <td className="px-4 py-2.5 font-medium">{wo.customer.name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{wo.product.name}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{new Date(wo.dueDate).toLocaleDateString('ko-KR')}</td>
                    <td className={`px-4 py-2.5 font-bold ${daysLeft <= 0 ? 'text-red-600' : daysLeft <= 1 ? 'text-orange-600' : 'text-yellow-600'}`}>
                      {daysLeft <= 0 ? `${Math.abs(daysLeft)}일 초과` : `${daysLeft}일`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 고객사별 납기 현황 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">고객사별 납기 현황 (30일)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['고객사', '총 출하', '완료', '납기 초과', 'OTD율'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customerStats.map((c) => {
              const rate = c.total > 0 ? Math.round(((c.total - c.overdue) / c.total) * 100) : 100;
              return (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{c.total}건</td>
                  <td className="px-4 py-2.5 text-green-600 font-semibold">{c.delivered}건</td>
                  <td className={`px-4 py-2.5 font-semibold ${c.overdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>{c.overdue}건</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${rate >= 95 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 ${rate >= 95 ? 'text-green-600' : rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>{rate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {customerStats.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
