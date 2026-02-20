'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, X, RefreshCw, Pencil, Trash2 } from 'lucide-react';

type SoStatus = 'received' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';

const STATUS_LABEL: Record<SoStatus, string> = {
  received:      '수주접수',
  confirmed:     '수주확정',
  in_production: '생산중',
  completed:     '완료',
  cancelled:     '취소',
};

const STATUS_COLOR: Record<SoStatus, string> = {
  received:      'bg-blue-100 text-blue-700',
  confirmed:     'bg-purple-100 text-purple-700',
  in_production: 'bg-yellow-100 text-yellow-700',
  completed:     'bg-green-100 text-green-700',
  cancelled:     'bg-slate-100 text-slate-500',
};

interface SalesOrder {
  id:         string;
  soNo:       string;
  orderedQty: number;
  dueDate:    string;
  status:     SoStatus;
  notes:      string | null;
  createdAt:  string;
  customer:   { name: string; code: string };
  product:    { name: string; code: string };
  createdBy:  { name: string };
}

interface Customer { id: string; name: string; code: string }
interface Product  { id: string; name: string; code: string }

// ── 수주 등록/수정 모달 ─────────────────────────────────────────────
function SalesOrderModal({
  order,
  customers,
  products,
  onClose,
  onSaved,
}: {
  order:     SalesOrder | null;
  customers: Customer[];
  products:  Product[];
  onClose:   () => void;
  onSaved:   () => void;
}) {
  const isEdit = !!order;
  const [customerId, setCustomerId] = useState(order?.customer?.code
    ? customers.find((c) => c.code === order.customer.code)?.id ?? ''
    : '');
  const [productId,  setProductId]  = useState(order?.product?.code
    ? products.find((p) => p.code === order.product.code)?.id ?? ''
    : '');
  const [orderedQty, setOrderedQty] = useState(String(order?.orderedQty ?? ''));
  const [dueDate,    setDueDate]    = useState(
    order ? order.dueDate.slice(0, 10) : '',
  );
  const [status,  setStatus]  = useState<SoStatus>(order?.status ?? 'received');
  const [notes,   setNotes]   = useState(order?.notes ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !productId || !orderedQty || !dueDate) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url    = isEdit ? `/api/sales-orders/${order!.id}` : '/api/sales-orders';
      const method = isEdit ? 'PATCH' : 'POST';
      const body: any = { orderedQty: parseInt(orderedQty), dueDate, notes };
      if (!isEdit) { body.customerId = customerId; body.productId = productId; }
      else         { body.status = status; }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? '오류 발생');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-slate-800">
            {isEdit ? '수주 수정' : '수주 등록'}
          </h2>
          <button onClick={onClose} aria-label="닫기" className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                고객사 <span className="text-red-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isEdit}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              >
                <option value="">선택</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                품목 <span className="text-red-500">*</span>
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={isEdit}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              >
                <option value="">선택</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                수주수량 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={orderedQty}
                onChange={(e) => setOrderedQty(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="EA"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                납기일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SoStatus)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(STATUS_LABEL) as SoStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">비고</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 삭제 확인 모달 ──────────────────────────────────────────────────
function DeleteModal({
  order,
  onClose,
  onDeleted,
}: {
  order:     SalesOrder;
  onClose:   () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleDelete() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/sales-orders/${order.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? '삭제 실패');
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">수주 삭제</h3>
        <p className="text-sm text-slate-600 mb-4">
          <span className="font-medium">{order.soNo}</span> 수주건을 삭제하시겠습니까?<br />
          이 작업은 되돌릴 수 없습니다.
        </p>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────
export default function SalesOrdersPage() {
  const [orders,    setOrders]    = useState<SalesOrder[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(true);
  const [q,         setQ]         = useState('');
  const [filterSt,  setFilterSt]  = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products,  setProducts]  = useState<Product[]>([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editOrder, setEditOrder] = useState<SalesOrder | null>(null);
  const [delOrder,  setDelOrder]  = useState<SalesOrder | null>(null);

  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q)        params.set('q',      q);
    if (filterSt) params.set('status', filterSt);
    const res = await fetch(`/api/sales-orders?${params}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.items);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, q, filterSt]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    Promise.all([
      fetch('/api/customers?limit=200').then((r) => r.json()),
      fetch('/api/products?limit=200').then((r) => r.json()),
    ]).then(([c, p]) => {
      setCustomers(c.items ?? c);
      setProducts(p.items ?? p);
    });
  }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">수주관리</h1>
          <p className="text-sm text-slate-500">고객 수주 현황 및 CRUD 관리</p>
        </div>
        <button
          onClick={() => { setEditOrder(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          수주 등록
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="수주번호 검색..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterSt}
          onChange={(e) => { setFilterSt(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">전체 상태</option>
          {(Object.keys(STATUS_LABEL) as SoStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
        >
          <RefreshCw size={13} />
          새로고침
        </button>
        <span className="ml-auto text-xs text-slate-400">총 {total}건</span>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">수주 목록</caption>
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-medium">수주번호</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">고객사</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">품목</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">수량</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">납기일</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">상태</th>
              <th scope="col" className="px-4 py-3 text-left font-medium">등록자</th>
              <th scope="col" className="px-4 py-3 text-center font-medium">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">로딩 중...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">수주 데이터가 없습니다.</td>
              </tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-blue-600">{o.soNo}</td>
                <td className="px-4 py-3 text-slate-700">
                  {o.customer.name}
                  <span className="ml-1 text-xs text-slate-400">({o.customer.code})</span>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {o.product.name}
                  <span className="ml-1 text-xs text-slate-400">({o.product.code})</span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">
                  {o.orderedQty.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(o.dueDate).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{o.createdBy.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => { setEditOrder(o); setShowForm(true); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      aria-label="수주 수정"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDelOrder(o)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label="수주 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 min-w-[44px] min-h-[44px]"
            >
              이전
            </button>
            <span className="text-sm text-slate-500" aria-live="polite">
              {page} / {totalPages} 페이지
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 min-w-[44px] min-h-[44px]"
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* 모달 */}
      {showForm && (
        <SalesOrderModal
          order={editOrder}
          customers={customers}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={fetchOrders}
        />
      )}
      {delOrder && (
        <DeleteModal
          order={delOrder}
          onClose={() => setDelOrder(null)}
          onDeleted={fetchOrders}
        />
      )}
    </div>
  );
}
