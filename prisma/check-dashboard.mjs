import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const today = new Date('2026-02-21');
const startOfDay = (d) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
const endOfDay   = (d) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };

const [todayLogs, activeOrders, equipStatus, pmDue, recentNcr] = await Promise.all([
  prisma.productionLog.aggregate({
    where: { createdAt: { gte: startOfDay(today), lte: endOfDay(today) } },
    _sum: { goodQty: true, defectQty: true, plannedQty: true },
  }),
  prisma.workOrder.findMany({
    where: { status: 'in_progress' },
    include: { product: { select: { name: true } }, customer: { select: { name: true } } },
    orderBy: { priority: 'asc' },
  }),
  prisma.equipment.groupBy({ by: ['status'], _count: { status: true } }),
  prisma.equipment.findMany({
    where: { pmCycleDays: { not: null }, lastPmDate: { lt: new Date(Date.now() - 7*24*60*60*1000) } },
    select: { code: true, name: true, lastPmDate: true, pmCycleDays: true },
  }),
  prisma.nonconformanceReport.findMany({
    where: { status: { in: ['open', 'in_review'] } },
    orderBy: { createdAt: 'desc' },
    take: 4,
    select: { ncrNo: true, disposition: true, status: true },
  }),
]);

const planned  = Number(todayLogs._sum.plannedQty ?? 0);
const produced = Number(todayLogs._sum.goodQty    ?? 0);
const defects  = Number(todayLogs._sum.defectQty  ?? 0);
const achieve  = planned > 0 ? Math.round((produced / planned) * 100) : 0;
const defRate  = (produced + defects) > 0 ? ((defects / (produced + defects)) * 100).toFixed(1) : '0.0';

console.log('══════════════════════════════════');
console.log('  대시보드 데이터 확인');
console.log('══════════════════════════════════');
console.log('\n📊 KPI 카드');
console.log(`  금일 생산 목표 : ${planned.toLocaleString()} EA`);
console.log(`  금일 생산 실적 : ${produced.toLocaleString()} EA`);
console.log(`  목표 달성률   : ${achieve}%`);
console.log(`  불량률        : ${defRate}%  (불량 ${defects} EA)`);

console.log(`\n🔧 진행중 작업지시 (${activeOrders.length}건)`);
for (const wo of activeOrders) {
  const rate = wo.plannedQty > 0 ? Math.round((Number(wo.producedQty) / Number(wo.plannedQty)) * 100) : 0;
  console.log(`  ${wo.woNo}  ${wo.product.name}  /  ${wo.customer.name}  → ${rate}%`);
}

console.log('\n⚙️  설비 현황');
const statusLabel = { running: '가동', stopped: '정지', maintenance: '보전', breakdown: '고장', idle: '대기' };
for (const s of equipStatus) {
  console.log(`  ${(statusLabel[s.status] ?? s.status).padEnd(4)} : ${s._count.status}대`);
}

console.log(`\n⚠️  PM 도래 설비 (${pmDue.length}건)`);
for (const e of pmDue.slice(0, 5)) {
  console.log(`  ${e.code}  ${e.name}`);
}
if (pmDue.length === 0) console.log('  없음');

console.log(`\n🚨 미결 NCR (${recentNcr.length}건)`);
for (const n of recentNcr) {
  console.log(`  ${n.ncrNo}  [${n.status}]`);
}
if (recentNcr.length === 0) console.log('  없음');

console.log('\n══════════════════════════════════');

await prisma.$disconnect();
