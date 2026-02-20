import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import AlertBanner from '@/components/ui/AlertBanner';

export default async function InventoryAlertsPage() {
  await auth();

  const inventories = await prisma.inventory.findMany({
    where: { materialId: { not: null } },
    include: { material: { select: { name: true, code: true, unit: true, safetyStock: true, supplier: true } } },
  });

  const alerts = inventories
    .filter((inv) => inv.material && Number(inv.qty) <= Number(inv.material.safetyStock))
    .map((inv) => ({
      ...inv,
      shortage: Number(inv.material!.safetyStock) - Number(inv.qty),
    }))
    .sort((a, b) => b.shortage - a.shortage);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">안전재고 미달 알림</h2>
      {alerts.length === 0 ? (
        <AlertBanner variant="success" message="모든 자재가 안전재고 이상입니다." />
      ) : (
        <>
          <AlertBanner
            variant="error"
            title={`안전재고 미달 ${alerts.length}건`}
            message="아래 자재는 즉시 발주가 필요합니다."
          />
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['자재코드', '자재명', '공급업체', '현재 재고', '안전재고', '부족량', '단위'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map((inv) => (
                  <tr key={inv.id} className="hover:bg-red-50 bg-red-50/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{inv.material?.code}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{inv.material?.name}</td>
                    <td className="px-4 py-2.5 text-gray-500">{inv.material?.supplier ?? '-'}</td>
                    <td className="px-4 py-2.5 text-red-600 font-bold">{Number(inv.qty).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-600">{Number(inv.material?.safetyStock).toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-red-700 font-bold">-{inv.shortage.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-gray-500">{inv.material?.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
