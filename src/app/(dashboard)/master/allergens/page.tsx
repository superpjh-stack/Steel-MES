'use client';

import { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';

interface AllergenCode {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  isActive: boolean;
}

export default function AllergensPage() {
  const [allergens, setAllergens] = useState<AllergenCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/allergens')
      .then((r) => r.json())
      .then((d) => { if (d.success) setAllergens(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
          <Leaf size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">알레르기코드 관리</h1>
          <p className="text-sm text-slate-500">식품위생법 알레르기 유발물질 21종 관리</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>📌 법적 근거:</strong> 식품위생법 시행규칙 제6조 및 식품 등의 표시기준 — 알레르기 유발물질 21종을 의무 표시
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">로딩 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allergens.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-amber-700">{a.code.replace('ALG-', '')}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm">{a.name}</p>
                {a.nameEn && <p className="text-xs text-slate-400">{a.nameEn}</p>}
              </div>
              <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-full text-xs ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {a.isActive ? '활성' : '비활성'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
