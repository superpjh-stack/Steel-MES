import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  available:  'bg-green-100 text-green-700',
  reserved:   'bg-blue-100 text-blue-700',
  quarantine: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  available: '가용', reserved: '예약', quarantine: '격리',
};

export default async function InventoryPage() {
  await auth();

  const [materials, products] = await Promise.all([
    prisma.inventory.findMany({
      where: { materialId: { not: null } },
      include: { material: { select: { name: true, code: true, unit: true, safetyStock: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.inventory.findMany({
      where: { productId: { not: null } },
      include: { product: { select: { name: true, code: true, unit: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const shortages = materials.filter(
    (inv) => inv.material && Number(inv.qty) <= Number(inv.material.safetyStock)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">재고 현황</h2>
        <div className="flex gap-3">
          {shortages > 0 && (
            <Link href="/inventory/alerts" className="text-sm text-red-600 font-medium hover:underline">
              ⚠ 안전재고 부족 {shortages}건
            </Link>
          )}
          <Link href="/inventory/movements" className="text-sm text-blue-600 hover:underline">입출고 이력 →</Link>
        </div>
      </div>

      {/* 자재 재고 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">자재 재고 ({materials.length}종)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['자재코드', '자재명', '로트번호', '수량', '단위', '안전재고', '위치', '상태'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materials.map((inv) => {
              const isShort = inv.material && Number(inv.qty) <= Number(inv.material.safetyStock);
              return (
                <tr key={inv.id} className={`hover:bg-gray-50 ${isShort ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{inv.material?.code}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{inv.material?.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{inv.lotNo ?? '-'}</td>
                  <td className={`px-4 py-2.5 font-bold ${isShort ? 'text-red-600' : 'text-gray-800'}`}>
                    {Number(inv.qty).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{inv.material?.unit}</td>
                  <td className="px-4 py-2.5 text-gray-500">{Number(inv.material?.safetyStock).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-gray-500">{inv.location ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status]}`}>
                      {STATUS_LABEL[inv.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
            {materials.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">자재 재고가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 제품 재고 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">제품 재고 ({products.length}종)</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['품목코드', '품목명', '로트번호', '수량', '단위', '위치', '상태'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{inv.product?.code}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{inv.product?.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{inv.lotNo ?? '-'}</td>
                <td className="px-4 py-2.5 font-bold text-gray-800">{Number(inv.qty).toLocaleString()}</td>
                <td className="px-4 py-2.5 text-gray-500">{inv.product?.unit}</td>
                <td className="px-4 py-2.5 text-gray-500">{inv.location ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[inv.status]}`}>
                    {STATUS_LABEL[inv.status]}
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">제품 재고가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
