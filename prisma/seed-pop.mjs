/**
 * seed-pop.mjs — POP 화면 샘플 작업지시 3건
 * 실행: node prisma/seed-pop.mjs
 *
 * 선행 조건: seed-kwangsung.mjs 가 먼저 실행되어야 합니다.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 POP 샘플 데이터 입력 시작...\n');

  // ── 기존 데이터 참조 ────────────────────────────────────────────────────
  const [manager, operator1, operator2] = await Promise.all([
    prisma.user.findUnique({ where: { email: 'manager@mes.local' } }),
    prisma.user.findUnique({ where: { email: 'operator1@mes.local' } }),
    prisma.user.findUnique({ where: { email: 'operator2@mes.local' } }),
  ]);

  if (!manager || !operator1 || !operator2) {
    throw new Error('기본 사용자가 없습니다. 먼저 seed-kwangsung.mjs 를 실행하세요.');
  }

  const [brk001, brk003, asy001] = await Promise.all([
    prisma.product.findUnique({ where: { code: 'BRK-001' } }),
    prisma.product.findUnique({ where: { code: 'BRK-003' } }),
    prisma.product.findUnique({ where: { code: 'ASY-001' } }),
  ]);

  if (!brk001 || !brk003 || !asy001) {
    throw new Error('기본 제품이 없습니다. 먼저 seed-kwangsung.mjs 를 실행하세요.');
  }

  // ── 작업지시 3건 ─────────────────────────────────────────────────────────
  //  notes 필드: "공정명 / 라인위치"  → POP 헤더에 표시
  const workOrders = [
    {
      woNo:         'WO-20260221-101',
      productId:    brk001.id,
      customerId:   brk001.customerId,
      plannedQty:   500,
      producedQty:  320,
      defectQty:    10,
      status:       'in_progress',
      plannedStart: new Date('2026-02-21T08:00:00'),
      plannedEnd:   new Date('2026-02-21T17:00:00'),
      actualStart:  new Date('2026-02-21T08:05:00'),
      dueDate:      new Date('2026-02-25'),
      priority:     2,
      createdById:  operator1.id,
      notes:        'CO2 용접 공정 / D라인-3번',
    },
    {
      woNo:         'WO-20260221-102',
      productId:    brk003.id,
      customerId:   brk003.customerId,
      plannedQty:   300,
      producedQty:  180,
      defectQty:    5,
      status:       'in_progress',
      plannedStart: new Date('2026-02-21T08:00:00'),
      plannedEnd:   new Date('2026-02-21T17:00:00'),
      actualStart:  new Date('2026-02-21T08:10:00'),
      dueDate:      new Date('2026-02-22'),
      priority:     1,
      createdById:  operator2.id,
      notes:        'Spot 용접 공정 / D라인-1번',
    },
    {
      woNo:         'WO-20260221-103',
      productId:    asy001.id,
      customerId:   asy001.customerId,
      plannedQty:   200,
      producedQty:  0,
      defectQty:    0,
      status:       'issued',
      plannedStart: new Date('2026-02-21T13:00:00'),
      plannedEnd:   new Date('2026-02-21T17:00:00'),
      dueDate:      new Date('2026-02-28'),
      priority:     5,
      createdById:  manager.id,
      notes:        '파킹브레이크 조립 / F라인-2번',
    },
  ];

  for (const wo of workOrders) {
    await prisma.workOrder.upsert({
      where: { woNo: wo.woNo },
      update: {
        producedQty: wo.producedQty,
        defectQty:   wo.defectQty,
        status:      wo.status,
        actualStart: wo.actualStart ?? null,
        notes:       wo.notes,
      },
      create: wo,
    });
    const goodQty = wo.producedQty - wo.defectQty;
    const pct     = wo.plannedQty > 0 ? Math.round((wo.producedQty / wo.plannedQty) * 100) : 0;
    console.log(`  ✅ ${wo.woNo}  ${wo.notes}`);
    console.log(`     상태: ${wo.status}  생산 ${wo.producedQty}/${wo.plannedQty} (${pct}%)  양품 ${goodQty}  불량 ${wo.defectQty}`);
  }

  console.log('\n✅ POP 샘플 데이터 완료 (작업지시 3건)');
  console.log('   → http://localhost:3000/pop 에서 확인하세요.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
