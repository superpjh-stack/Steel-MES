'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SoStatus = 'received' | 'confirmed' | 'in_production' | 'completed' | 'cancelled';
interface Order {
  id: string; soNo: string; dueDate: string; status: SoStatus;
  customer: { name: string }; product: { name: string; code: string };
  orderedQty: number;
}

const STATUS_COLOR: Record<SoStatus, string> = {
  received: 'bg-gray-200 text-gray-700', confirmed: 'bg-blue-100 text-blue-700',
  in_production: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
};
const STATUS_LABEL: Record<SoStatus, string> = {
  received: '접수', confirmed: '확정', in_production: '생산중', completed: '완료', cancelled: '취소',
};
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function DeliveryCalendarPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales/delivery-calendar?year=${year}&month=${month}`)
      .then(r => r.json()).then(res => setOrders(res.data ?? []))
      .finally(() => setLoading(false));
    setSelectedDay(null);
  }, [year, month]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const firstDay  = new Date(year, month - 1, 1).getDay();
  const daysCount = new Date(year, month, 0).getDate();

  const byDay = new Map<number, Order[]>();
  for (const o of orders) {
    const d = new Date(o.dueDate).getDate();
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(o);
  }

  const selectedOrders = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">납기캘린더조회</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} aria-label="이전 달" className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-semibold text-gray-900 min-w-[90px] text-center">{year}년 {month}월</span>
          <button onClick={nextMonth} aria-label="다음 달" className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DAYS.map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-medium ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>{d}</div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">불러오는 중…</div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-100 bg-gray-50/50" />
            ))}
            {Array.from({ length: daysCount }).map((_, i) => {
              const day = i + 1;
              const dayOrders = byDay.get(day) ?? [];
              const isToday = year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
              const colIdx = (firstDay + i) % 7;
              return (
                <div
                  key={day}
                  onClick={() => dayOrders.length > 0 && setSelectedDay(selectedDay === day ? null : day)}
                  className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 ${dayOrders.length > 0 ? 'cursor-pointer hover:bg-blue-50' : ''} ${selectedDay === day ? 'bg-blue-50 ring-2 ring-blue-400 ring-inset' : ''}`}
                >
                  <p className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : colIdx === 0 ? 'text-red-500' : colIdx === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                    {day}
                  </p>
                  <div className="space-y-0.5">
                    {dayOrders.slice(0, 2).map(o => (
                      <div key={o.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${STATUS_COLOR[o.status]}`}>
                        {o.customer.name}
                      </div>
                    ))}
                    {dayOrders.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">+{dayOrders.length - 2}건 더</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택일 상세 */}
      {selectedDay && selectedOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 text-sm">{year}년 {month}월 {selectedDay}일 납기 ({selectedOrders.length}건)</h2>
          <div className="space-y-2">
            {selectedOrders.map(o => (
              <div key={o.id} className="flex items-center gap-3 text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                <span className="font-mono text-xs text-blue-700">{o.soNo}</span>
                <span className="text-gray-900">{o.customer.name}</span>
                <span className="text-gray-500">{o.product.name}</span>
                <span className="ml-auto text-gray-700 font-medium">{o.orderedQty.toLocaleString()} EA</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
