'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, ChevronDown, ChevronRight, FlaskConical } from 'lucide-react';

interface RecipeIngredient {
  id: string;
  materialId: string;
  material: { code: string; name: string; unit: string };
  ratio: number;
  amountKg: number;
  sortOrder: number;
}

interface Recipe {
  id: string;
  productId: string;
  product: { code: string; name: string; category: string };
  version: string;
  batchSizeKg: number;
  status: string;
  notes: string | null;
  createdAt: string;
  ingredients: RecipeIngredient[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:    { label: '초안',    color: 'bg-slate-100 text-slate-600' },
  approved: { label: '승인됨',  color: 'bg-green-100 text-green-700' },
  obsolete: { label: '폐기',    color: 'bg-red-100 text-red-600' },
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/recipes')
      .then((r) => r.json())
      .then((d) => { if (d.success) setRecipes(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = recipes.filter(
    (r) =>
      r.product.name.includes(searchTerm) ||
      r.product.code.includes(searchTerm) ||
      r.version.includes(searchTerm),
  );

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <BookOpen size={20} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">배합비(레시피) 관리</h1>
            <p className="text-sm text-slate-500">제품별 원료 배합 비율 및 투입량 관리</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
          <Plus size={16} /> 배합비 등록
        </button>
      </div>

      {/* 검색 */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="품목명, 품목코드 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '전체 배합비', value: recipes.length, color: 'text-slate-700' },
          { label: '승인된 배합비', value: recipes.filter((r) => r.status === 'approved').length, color: 'text-green-600' },
          { label: '초안/검토중', value: recipes.filter((r) => r.status === 'draft').length, color: 'text-amber-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
          <p>등록된 배합비가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe) => {
            const statusInfo = STATUS_LABEL[recipe.status] ?? { label: recipe.status, color: 'bg-slate-100 text-slate-600' };
            const isOpen = expanded === recipe.id;
            return (
              <div key={recipe.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {/* 레시피 헤더 */}
                <button
                  onClick={() => setExpanded(isOpen ? null : recipe.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                    <BookOpen size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{recipe.product.name}</span>
                      <span className="text-xs text-slate-400">{recipe.product.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      v{recipe.version} · 배치 {recipe.batchSizeKg.toLocaleString()}kg · 원료 {recipe.ingredients.length}종
                    </div>
                  </div>
                  {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                </button>

                {/* 원료 상세 */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">원료 배합 상세</p>
                    {recipe.ingredients.length === 0 ? (
                      <p className="text-sm text-slate-400">등록된 원료가 없습니다.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-200">
                              <th className="text-left pb-2 font-medium">순서</th>
                              <th className="text-left pb-2 font-medium">원료명</th>
                              <th className="text-left pb-2 font-medium">코드</th>
                              <th className="text-right pb-2 font-medium">배합비율(%)</th>
                              <th className="text-right pb-2 font-medium">투입량(kg)</th>
                              <th className="text-left pb-2 font-medium">단위</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recipe.ingredients
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map((ing) => (
                                <tr key={ing.id} className="border-b border-slate-100 last:border-0">
                                  <td className="py-2 text-slate-400 text-xs">{ing.sortOrder + 1}</td>
                                  <td className="py-2 font-medium text-slate-800">{ing.material.name}</td>
                                  <td className="py-2 text-slate-400 text-xs">{ing.material.code}</td>
                                  <td className="py-2 text-right text-blue-600 font-semibold">{ing.ratio.toFixed(2)}%</td>
                                  <td className="py-2 text-right font-semibold text-slate-700">{ing.amountKg.toFixed(2)}</td>
                                  <td className="py-2 text-slate-500 text-xs">{ing.material.unit}</td>
                                </tr>
                              ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-slate-200 font-bold">
                              <td colSpan={3} className="pt-2 text-slate-600 text-xs">합계</td>
                              <td className="pt-2 text-right text-blue-700">
                                {recipe.ingredients.reduce((s, i) => s + i.ratio, 0).toFixed(2)}%
                              </td>
                              <td className="pt-2 text-right text-slate-700">
                                {recipe.ingredients.reduce((s, i) => s + i.amountKg, 0).toFixed(2)}
                              </td>
                              <td className="pt-2 text-slate-500 text-xs">kg</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                    {recipe.notes && (
                      <p className="mt-3 text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
                        📝 {recipe.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
