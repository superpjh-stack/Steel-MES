'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Product {
  id: string;
  code: string;
  name: string;
  stdCycleSec: number | null;
  customer: { id: string; name: string };
}

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface Props {
  products: Product[];
  customers: Customer[];
}

export default function WorkOrderForm({ products, customers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 16); // datetime-local format
  const dueDateDefault = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [form, setForm] = useState({
    productId: '',
    customerId: '',
    plannedQty: '',
    plannedStart: todayStr,
    plannedEnd: todayStr,
    dueDate: dueDateDefault,
    priority: '5',
    notes: '',
  });

  // 제품 선택 시 고객사 자동 설정
  function handleProductChange(productId: string) {
    const product = products.find((p) => p.id === productId);
    setForm((f) => ({
      ...f,
      productId,
      customerId: product?.customer.id ?? f.customerId,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          customerId: form.customerId,
          plannedQty: Number(form.plannedQty),
          plannedStart: new Date(form.plannedStart).toISOString(),
          plannedEnd: new Date(form.plannedEnd).toISOString(),
          dueDate: form.dueDate,
          priority: Number(form.priority),
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? '등록에 실패했습니다.');
        return;
      }

      router.push('/production/work-orders');
      router.refresh();
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === form.productId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* 제품 / 고객사 */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold text-gray-700 mb-4">품목 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
              품목 <span className="text-red-500">*</span>
            </label>
            <select
              id="productId"
              required
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">품목을 선택하세요</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="mt-1 text-xs text-gray-400">
                표준 사이클: {selectedProduct.stdCycleSec ?? '-'}초/EA
              </p>
            )}
          </div>

          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
              고객사 <span className="text-red-500">*</span>
            </label>
            <select
              id="customerId"
              required
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">고객사를 선택하세요</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 수량 / 우선순위 */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold text-gray-700 mb-4">생산 계획</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="plannedQty" className="block text-sm font-medium text-gray-700 mb-1">
              계획 수량 (EA) <span className="text-red-500">*</span>
            </label>
            <input
              id="plannedQty"
              type="number"
              min="1"
              required
              value={form.plannedQty}
              onChange={(e) => setForm((f) => ({ ...f, plannedQty: e.target.value }))}
              placeholder="예: 1000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              우선순위 (1=최고, 10=최저)
            </label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? '(긴급)' : n === 5 ? '(보통)' : n === 10 ? '(낮음)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              납기일 <span className="text-red-500">*</span>
            </label>
            <input
              id="dueDate"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 계획 일정 */}
      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-semibold text-gray-700 mb-4">생산 일정</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700 mb-1">
              계획 시작 <span className="text-red-500">*</span>
            </label>
            <input
              id="plannedStart"
              type="datetime-local"
              required
              value={form.plannedStart}
              onChange={(e) => setForm((f) => ({ ...f, plannedStart: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="plannedEnd" className="block text-sm font-medium text-gray-700 mb-1">
              계획 종료 <span className="text-red-500">*</span>
            </label>
            <input
              id="plannedEnd"
              type="datetime-local"
              required
              value={form.plannedEnd}
              onChange={(e) => setForm((f) => ({ ...f, plannedEnd: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 비고 */}
      <div className="bg-white rounded-lg border p-5">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          비고
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="특이사항을 입력하세요"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '작업지시 등록'}
        </button>
      </div>
    </form>
  );
}
