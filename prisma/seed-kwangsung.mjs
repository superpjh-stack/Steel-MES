import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 광성정밀 기본데이터 입력 시작...');

  // ── 사용자 계정 ──────────────────────────────────────
  const users = [
    { email: 'admin@mes.local', name: '시스템관리자', password: 'admin1234!', role: 'admin', department: '시스템' },
    { email: 'manager@mes.local', name: '이공장장', password: 'mgr1234!', role: 'manager', department: '생산관리팀' },
    { email: 'operator1@mes.local', name: '김작업자', password: 'oper1234!', role: 'operator', department: '생산1팀', shift: '1st' },
    { email: 'operator2@mes.local', name: '박작업자', password: 'oper1234!', role: 'operator', department: '생산2팀', shift: '2nd' },
    { email: 'qc1@mes.local', name: '이품질', password: 'qc1234!', role: 'qc', department: '품질팀' },
    { email: 'qc2@mes.local', name: '최검사', password: 'qc1234!', role: 'qc', department: '품질팀' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, passwordHash: hash, role: u.role, department: u.department, shift: u.shift ?? null },
    });
  }
  console.log(`✅ 계정 ${users.length}개 완료`);

  // ── 고객사 ──────────────────────────────────────────
  const customerData = [
    { code: 'HMC', name: '현대자동차(주)', contact: '구매1팀', otdTarget: 98 },
    { code: 'KIA', name: '기아(주)', contact: '구매2팀', otdTarget: 97 },
    { code: 'GMK', name: '한국GM(주)', contact: '부품구매팀', otdTarget: 95 },
    { code: 'RSM', name: '르노코리아자동차', contact: '협력사팀', otdTarget: 96 },
    { code: 'SSY', name: 'KG모빌리티(주)', contact: '구매팀', otdTarget: 95 },
  ];
  const customers = {};
  for (const c of customerData) {
    const cust = await prisma.customer.upsert({ where: { code: c.code }, update: {}, create: c });
    customers[c.code] = cust;
  }
  console.log(`✅ 고객사 ${customerData.length}개 완료`);

  // ── 설비 ──────────────────────────────────────────
  const lastPm = new Date('2026-02-01');
  const equipmentData = [
    // 프레스 설비
    { code: 'TRF-001', name: 'Transfer Press #1 (300T)', type: 'press', location: 'A라인-1번', pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    { code: 'TRF-002', name: 'Transfer Press #2 (300T)', type: 'press', location: 'A라인-2번', pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    { code: 'TRF-003', name: 'Transfer Press #3 (250T)', type: 'press', location: 'A라인-3번', pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    { code: 'SHT-001', name: 'Shuttle Robot Line #1', type: 'press', location: 'B라인-1번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'SHT-002', name: 'Shuttle Robot Line #2', type: 'press', location: 'B라인-2번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'DCP-001', name: 'Double Crank Press #1 (200T)', type: 'press', location: 'C라인-1번', pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    { code: 'DCP-002', name: 'Double Crank Press #2 (150T)', type: 'press', location: 'C라인-2번', pmCycleDays: 30, lastPmDate: lastPm, status: 'idle' },
    // 용접 설비
    { code: 'SPW-001', name: 'Spot Welding #1', type: 'welding', location: 'D라인-1번', pmCycleDays: 15, lastPmDate: lastPm, status: 'running' },
    { code: 'SPW-002', name: 'Spot Welding #2', type: 'welding', location: 'D라인-2번', pmCycleDays: 15, lastPmDate: lastPm, status: 'running' },
    { code: 'CO2-001', name: 'CO2 Robot Welding #1', type: 'welding', location: 'D라인-3번', pmCycleDays: 7, lastPmDate: lastPm, status: 'running' },
    { code: 'CO2-002', name: 'CO2 Robot Welding #2', type: 'welding', location: 'D라인-4번', pmCycleDays: 7, lastPmDate: lastPm, status: 'maintenance' },
    // 도장 설비
    { code: 'CTG-001', name: '전착도장 Line #1', type: 'coating', location: 'E라인-1번', pmCycleDays: 60, lastPmDate: lastPm, status: 'running' },
    { code: 'CTG-002', name: '전착도장 Line #2', type: 'coating', location: 'E라인-2번', pmCycleDays: 60, lastPmDate: lastPm, status: 'running' },
    // 조립 설비
    { code: 'PKB-001', name: 'Parking Brake Assy Line #1', type: 'assembly', location: 'F라인-1번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'PKB-002', name: 'Parking Brake Assy Line #2', type: 'assembly', location: 'F라인-2번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'PKB-003', name: 'Drum Brake Assy Line #1', type: 'assembly', location: 'F라인-3번', pmCycleDays: 14, lastPmDate: lastPm, status: 'idle' },
    { code: 'COL-001', name: 'Column Assy Line #1', type: 'assembly', location: 'G라인-1번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'COL-002', name: 'Column Assy Line #2', type: 'assembly', location: 'G라인-2번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
  ];
  const equipMap = {};
  for (const eq of equipmentData) {
    const e = await prisma.equipment.upsert({ where: { code: eq.code }, update: {}, create: eq });
    equipMap[eq.code] = e;
  }
  console.log(`✅ 설비 ${equipmentData.length}개 완료`);

  // ── 제품 ──────────────────────────────────────────
  const productData = [
    // 제동부품
    { code: 'BRK-001', name: '파킹 브레이크 케이블 LH', category: 'brake', unit: 'EA', custCode: 'HMC', drawingNo: 'DWG-BRK-001-A', stdCycleSec: 38 },
    { code: 'BRK-002', name: '파킹 브레이크 케이블 RH', category: 'brake', unit: 'EA', custCode: 'HMC', drawingNo: 'DWG-BRK-002-A', stdCycleSec: 38 },
    { code: 'BRK-003', name: '드럼 브레이크 슈 LH', category: 'brake', unit: 'EA', custCode: 'KIA', drawingNo: 'DWG-BRK-003-B', stdCycleSec: 55 },
    { code: 'BRK-004', name: '드럼 브레이크 슈 RH', category: 'brake', unit: 'EA', custCode: 'KIA', drawingNo: 'DWG-BRK-004-B', stdCycleSec: 55 },
    { code: 'BRK-005', name: 'Front Shell Assy', category: 'brake', unit: 'EA', custCode: 'GMK', drawingNo: 'DWG-BRK-005-A', stdCycleSec: 72 },
    // 조향부품
    { code: 'STR-001', name: '조향 컬럼 어셈블리', category: 'steering', unit: 'EA', custCode: 'HMC', drawingNo: 'DWG-STR-001-C', stdCycleSec: 120 },
    { code: 'STR-002', name: '스티어링 샤프트 LH', category: 'steering', unit: 'EA', custCode: 'KIA', drawingNo: 'DWG-STR-002-A', stdCycleSec: 45 },
    { code: 'STR-003', name: '스티어링 샤프트 RH', category: 'steering', unit: 'EA', custCode: 'KIA', drawingNo: 'DWG-STR-003-A', stdCycleSec: 45 },
    // Fine Blanking
    { code: 'FBK-001', name: 'Fine Blanking 레버 플레이트', category: 'fine_blanking', unit: 'EA', custCode: 'RSM', drawingNo: 'DWG-FBK-001-A', stdCycleSec: 12 },
    { code: 'FBK-002', name: 'Fine Blanking 브레이크 플레이트', category: 'fine_blanking', unit: 'EA', custCode: 'HMC', drawingNo: 'DWG-FBK-002-B', stdCycleSec: 10 },
    // 조립 완제품
    { code: 'ASY-001', name: '파킹 브레이크 완제품 (HMC)', category: 'assembly', unit: 'EA', custCode: 'HMC', drawingNo: 'DWG-ASY-001-A', stdCycleSec: 240 },
    { code: 'ASY-002', name: '파킹 브레이크 완제품 (KIA)', category: 'assembly', unit: 'EA', custCode: 'KIA', drawingNo: 'DWG-ASY-002-A', stdCycleSec: 240 },
    // 기타 부품
    { code: 'ETC-001', name: '브라켓 서포트', category: 'other', unit: 'EA', custCode: 'SSY', drawingNo: 'DWG-ETC-001-A', stdCycleSec: 18 },
    { code: 'ETC-002', name: '클립 어셈블리', category: 'other', unit: 'EA', custCode: 'GMK', drawingNo: 'DWG-ETC-002-A', stdCycleSec: 8 },
  ];
  const productMap = {};
  for (const p of productData) {
    const { custCode, ...rest } = p;
    const prod = await prisma.product.upsert({
      where: { code: p.code },
      update: {},
      create: { ...rest, customerId: customers[custCode].id },
    });
    productMap[p.code] = prod;
  }
  console.log(`✅ 제품 ${productData.length}개 완료`);

  // ── 공정 ──────────────────────────────────────────
  const processData = [
    // BRK-001 파킹 브레이크 케이블 LH
    { code: 'P-BRK001-010', name: '프레스 성형', seq: 1, productCode: 'BRK-001', equipCode: 'TRF-001' },
    { code: 'P-BRK001-020', name: 'CO2 용접', seq: 2, productCode: 'BRK-001', equipCode: 'CO2-001' },
    { code: 'P-BRK001-030', name: '전착도장', seq: 3, productCode: 'BRK-001', equipCode: 'CTG-001' },
    { code: 'P-BRK001-040', name: '파킹브레이크 조립', seq: 4, productCode: 'BRK-001', equipCode: 'PKB-001' },
    { code: 'P-BRK001-050', name: '출하검사', seq: 5, productCode: 'BRK-001' },
    // BRK-003 드럼 브레이크 슈 LH
    { code: 'P-BRK003-010', name: '프레스 성형', seq: 1, productCode: 'BRK-003', equipCode: 'TRF-002' },
    { code: 'P-BRK003-020', name: 'Spot 용접', seq: 2, productCode: 'BRK-003', equipCode: 'SPW-001' },
    { code: 'P-BRK003-030', name: '전착도장', seq: 3, productCode: 'BRK-003', equipCode: 'CTG-001' },
    { code: 'P-BRK003-040', name: '드럼브레이크 조립', seq: 4, productCode: 'BRK-003', equipCode: 'PKB-003' },
    { code: 'P-BRK003-050', name: '출하검사', seq: 5, productCode: 'BRK-003' },
    // BRK-005 Front Shell
    { code: 'P-BRK005-010', name: 'Shuttle Robot 프레스', seq: 1, productCode: 'BRK-005', equipCode: 'SHT-001' },
    { code: 'P-BRK005-020', name: 'CO2 용접', seq: 2, productCode: 'BRK-005', equipCode: 'CO2-002' },
    { code: 'P-BRK005-030', name: '전착도장', seq: 3, productCode: 'BRK-005', equipCode: 'CTG-002' },
    { code: 'P-BRK005-040', name: '출하검사', seq: 4, productCode: 'BRK-005' },
    // STR-001 조향 컬럼 어셈블리
    { code: 'P-STR001-010', name: 'Double Crank 프레스', seq: 1, productCode: 'STR-001', equipCode: 'DCP-001' },
    { code: 'P-STR001-020', name: 'CO2 용접', seq: 2, productCode: 'STR-001', equipCode: 'CO2-001' },
    { code: 'P-STR001-030', name: '컬럼 조립', seq: 3, productCode: 'STR-001', equipCode: 'COL-001' },
    { code: 'P-STR001-040', name: '출하검사', seq: 4, productCode: 'STR-001' },
    // STR-002 스티어링 샤프트 LH
    { code: 'P-STR002-010', name: 'Transfer 프레스', seq: 1, productCode: 'STR-002', equipCode: 'TRF-003' },
    { code: 'P-STR002-020', name: 'CO2 용접', seq: 2, productCode: 'STR-002', equipCode: 'CO2-001' },
    { code: 'P-STR002-030', name: '컬럼 조립', seq: 3, productCode: 'STR-002', equipCode: 'COL-002' },
    { code: 'P-STR002-040', name: '출하검사', seq: 4, productCode: 'STR-002' },
    // FBK-001 Fine Blanking
    { code: 'P-FBK001-010', name: 'Fine Blanking 성형', seq: 1, productCode: 'FBK-001', equipCode: 'DCP-002' },
    { code: 'P-FBK001-020', name: '버 제거 (디버링)', seq: 2, productCode: 'FBK-001' },
    { code: 'P-FBK001-030', name: '출하검사', seq: 3, productCode: 'FBK-001' },
    // ASY-001 파킹브레이크 완제품 HMC
    { code: 'P-ASY001-010', name: '프레스 성형', seq: 1, productCode: 'ASY-001', equipCode: 'TRF-003' },
    { code: 'P-ASY001-020', name: 'Spot 용접', seq: 2, productCode: 'ASY-001', equipCode: 'SPW-002' },
    { code: 'P-ASY001-030', name: '전착도장', seq: 3, productCode: 'ASY-001', equipCode: 'CTG-001' },
    { code: 'P-ASY001-040', name: '파킹브레이크 조립', seq: 4, productCode: 'ASY-001', equipCode: 'PKB-002' },
    { code: 'P-ASY001-050', name: '완성검사', seq: 5, productCode: 'ASY-001' },
    { code: 'P-ASY001-060', name: '출하검사', seq: 6, productCode: 'ASY-001' },
  ];
  for (const p of processData) {
    const { productCode, equipCode, ...rest } = p;
    await prisma.process.upsert({
      where: { code: p.code },
      update: {},
      create: {
        ...rest,
        productId: productMap[productCode].id,
        ...(equipCode ? { equipmentId: equipMap[equipCode].id } : {}),
      },
    });
  }
  console.log(`✅ 공정 ${processData.length}개 완료`);

  // ── 원자재 ──────────────────────────────────────────
  const materialData = [
    { code: 'MAT-001', name: 'SPCC 냉연강판 t1.2', unit: 'KG', spec: 'SPCC t1.2 x 1200W', safetyStock: 5000 },
    { code: 'MAT-002', name: 'SPCC 냉연강판 t2.0', unit: 'KG', spec: 'SPCC t2.0 x 1000W', safetyStock: 3000 },
    { code: 'MAT-003', name: 'SPHC 열연강판 t3.2', unit: 'KG', spec: 'SPHC t3.2 x 1200W', safetyStock: 4000 },
    { code: 'MAT-004', name: 'SWM-B 와이어 ø4.0', unit: 'KG', spec: 'SWM-B ø4.0mm', safetyStock: 1000 },
    { code: 'MAT-005', name: 'CO2 용접봉 ER70S-6', unit: 'KG', spec: 'ø0.8mm', safetyStock: 500 },
    { code: 'MAT-006', name: '전착도료 (흑색)', unit: 'L', spec: '수용성 에폭시 도료', safetyStock: 300 },
    { code: 'MAT-007', name: '조립 볼트 M8x25', unit: 'EA', spec: 'M8x25 스테인리스', safetyStock: 10000 },
  ];
  for (const m of materialData) {
    await prisma.material.upsert({ where: { code: m.code }, update: {}, create: m });
  }
  console.log(`✅ 원자재 ${materialData.length}개 완료`);

  console.log('');
  console.log('🎉 광성정밀 기본데이터 입력 완료!');
  console.log('   - 계정 6개 / 고객사 5개 / 설비 18개 / 제품 14개 / 공정 30개 / 원자재 7개');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
