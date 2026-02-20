import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const TYPE_LABEL: Record<string, string> = {
  receipt: '입고', issue: '출고', return: '반납', adjustment: '조정', shipment: '출하',
};
const TYPE_COLOR: Record<string, string> = {
  receipt:    'text-green-600',
  issue:      'text-red-600',
  return:     'text-blue-600',
  adjustment: 'text-yellow-600',
  shipment:   'text-purple-600',
};

export default async function MovementsPage() {
  await auth();

  const movements = await prisma.inventoryMovement.findMany({
    include: {
      inventory: {
        include: {
          material: { select: { name: true, code: true, unit: true } },
          product:  { select: { name: true, code: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">재고 입출고 이력</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['구분', '품목/자재', '수량', '단위', '참조번호', '일시'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {movements.map((m) => {
              const item = m.inventory.material ?? m.inventory.product;
              const qty  = Number(m.qty);
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className={`px-4 py-2.5 font-semibold ${TYPE_COLOR[m.movementType]}`}>
                    {TYPE_LABEL[m.movementType]}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800">{item?.name ?? '-'}</p>
                    <p className="text-xs font-mono text-gray-400">{item?.code}</p>
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${qty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {qty > 0 ? '+' : ''}{qty.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{item?.unit}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{m.referenceNo ?? '-'}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">
                    {new Date(m.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">이력이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
