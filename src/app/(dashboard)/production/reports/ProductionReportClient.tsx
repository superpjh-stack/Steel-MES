'use client';

import ProductionBar from '@/components/charts/ProductionBar';

interface DailyData {
  label: string;
  planned: number;
  produced: number;
  defect: number;
}

interface ProductData {
  productCode: string;
  productName: string;
  woCount: number;
  planned: number;
  produced: number;
  defect: number;
}

interface Props {
  daily: DailyData[];
  byProduct: ProductData[];
}

export default function ProductionReportClient({ daily, byProduct }: Props) {
  return (
    <div className="space-y-6">
      {/* 일별 생산 차트 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-4">일별 생산 실적</h3>
        <ProductionBar data={daily} showDefect height={240} />
      </div>

      {/* 품목별 집계 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">품목별 실적</h3>
        </div>
        {byProduct.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">데이터가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['품목코드', '품목명', 'WO', '계획', '실적', '불량', '달성률', '불량률'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byProduct.map((r) => {
                const achRate = r.planned > 0 ? Math.round((r.produced / r.planned) * 100) : 0;
                const defRate = (r.produced + r.defect) > 0
                  ? ((r.defect / (r.produced + r.defect)) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={r.productCode} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{r.productCode}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{r.productName}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{r.woCount}</td>
                    <td className="px-4 py-2.5 text-right">{r.planned.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-green-600 font-semibold">{r.produced.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-red-500">{r.defect.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={achRate >= 90 ? 'text-green-600 font-semibold' : achRate >= 70 ? 'text-yellow-600' : 'text-red-500'}>
                        {achRate}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={parseFloat(defRate) > 2 ? 'text-red-500' : 'text-gray-600'}>
                        {defRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
