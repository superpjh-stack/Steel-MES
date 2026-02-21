import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 니즈푸드 기본데이터 입력 시작...');

  // ── 사용자 계정 ──────────────────────────────────────
  const users = [
    { email: 'admin@mes.local',    name: '시스템관리자', password: 'admin1234!', role: 'admin',      department: '시스템' },
    { email: 'manager@mes.local',  name: '이공장장',     password: 'mgr1234!',   role: 'manager',    department: '생산관리팀' },
    { email: 'supervisor@mes.local', name: '박현장',     password: 'sup1234!',   role: 'supervisor', department: '생산1팀' },
    { email: 'operator1@mes.local', name: '김작업자',    password: 'oper1234!',  role: 'operator',   department: '생산1팀', shift: '1st' },
    { email: 'operator2@mes.local', name: '박작업자',    password: 'oper1234!',  role: 'operator',   department: '생산2팀', shift: '2nd' },
    { email: 'qc1@mes.local',      name: '이품질',       password: 'qc1234!',    role: 'qc',         department: '품질팀' },
    { email: 'qc2@mes.local',      name: '최검사',       password: 'qc1234!',    role: 'qc',         department: '품질팀' },
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

  // ── 거래처 (고객사) ──────────────────────────────────
  const customerData = [
    { code: 'EMART',    name: '이마트(주)',          contact: '식품구매팀',   otdTarget: 98 },
    { code: 'LOTTE',    name: '롯데마트(주)',         contact: '신선식품팀',   otdTarget: 97 },
    { code: 'HOMEPLUS', name: '홈플러스(주)',         contact: '가공식품팀',   otdTarget: 96 },
    { code: 'COUPANG',  name: '쿠팡(주)',            contact: '신선배송팀',   otdTarget: 99 },
    { code: 'HYUNDAI',  name: '현대백화점(주)',       contact: '프리미엄식품팀', otdTarget: 97 },
    { code: 'EXPORT',   name: '해외수출(일반)',       contact: '수출팀',       otdTarget: 95 },
  ];
  const customers = {};
  for (const c of customerData) {
    const cust = await prisma.customer.upsert({ where: { code: c.code }, update: {}, create: c });
    customers[c.code] = cust;
  }
  console.log(`✅ 거래처 ${customerData.length}개 완료`);

  // ── 설비 (식품 제조) ─────────────────────────────────
  const lastPm = new Date('2026-02-01');
  const equipmentData = [
    // 배합/혼합 설비
    { code: 'MIX-001', name: '대형 배합기 #1 (2,000L)',     type: 'mixer',      location: '배합실-1번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'MIX-002', name: '대형 배합기 #2 (2,000L)',     type: 'mixer',      location: '배합실-2번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'MIX-003', name: '소형 배합기 (500L)',           type: 'mixer',      location: '배합실-3번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    // 살균/가열 설비
    { code: 'PAS-001', name: '플레이트 살균기 #1',          type: 'pasteurizer', location: '살균실-1번',   pmCycleDays: 7,  lastPmDate: lastPm, status: 'running' },
    { code: 'PAS-002', name: '플레이트 살균기 #2',          type: 'pasteurizer', location: '살균실-2번',   pmCycleDays: 7,  lastPmDate: lastPm, status: 'running' },
    { code: 'RTT-001', name: '레토르트 살균기 #1',          type: 'retort',     location: '살균실-3번',   pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    // 냉각 설비
    { code: 'COL-001', name: '냉각탱크 #1 (2,000L)',        type: 'cooler',     location: '냉각실-1번',   pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    { code: 'COL-002', name: '냉각탱크 #2 (2,000L)',        type: 'cooler',     location: '냉각실-2번',   pmCycleDays: 30, lastPmDate: lastPm, status: 'running' },
    // 충전 설비
    { code: 'FIL-001', name: '자동 충전기 #1 (페트)',       type: 'filler',     location: '충전실-1번',   pmCycleDays: 7,  lastPmDate: lastPm, status: 'running' },
    { code: 'FIL-002', name: '자동 충전기 #2 (파우치)',     type: 'filler',     location: '충전실-2번',   pmCycleDays: 7,  lastPmDate: lastPm, status: 'running' },
    { code: 'FIL-003', name: '자동 충전기 #3 (유리병)',     type: 'filler',     location: '충전실-3번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'maintenance' },
    // 포장 설비
    { code: 'PKG-001', name: '자동 포장기 #1',              type: 'packager',   location: '포장실-1번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'PKG-002', name: '자동 포장기 #2',              type: 'packager',   location: '포장실-2번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    { code: 'PKG-003', name: '수축포장기',                  type: 'packager',   location: '포장실-3번',   pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    // 검사/이물검출
    { code: 'MTL-001', name: '금속검출기 #1',              type: 'metal_detector', location: '출하검사장-1번', pmCycleDays: 7, lastPmDate: lastPm, status: 'running' },
    { code: 'MTL-002', name: '금속검출기 #2',              type: 'metal_detector', location: '출하검사장-2번', pmCycleDays: 7, lastPmDate: lastPm, status: 'running' },
    { code: 'XRY-001', name: 'X-RAY 이물검출기',           type: 'xray',       location: '출하검사장-3번', pmCycleDays: 14, lastPmDate: lastPm, status: 'running' },
    // 창고 설비
    { code: 'REF-001', name: '냉장 창고 #1 (0~5℃)',       type: 'refrigerator', location: '냉장창고',    pmCycleDays: 90, lastPmDate: lastPm, status: 'running' },
    { code: 'FRZ-001', name: '냉동 창고 #1 (-18℃이하)',    type: 'freezer',    location: '냉동창고',     pmCycleDays: 90, lastPmDate: lastPm, status: 'running' },
  ];
  const equipMap = {};
  for (const eq of equipmentData) {
    const e = await prisma.equipment.upsert({ where: { code: eq.code }, update: {}, create: eq });
    equipMap[eq.code] = e;
  }
  console.log(`✅ 설비 ${equipmentData.length}개 완료`);

  // ── 제품 (식품) ───────────────────────────────────────
  const productData = [
    // 장류
    { code: 'SRC-001', name: '니즈 고추장 500g',        category: '장류',    unit: '병',   custCode: 'EMART',   stdCycleSec: 45 },
    { code: 'SRC-002', name: '니즈 된장 500g',          category: '장류',    unit: '병',   custCode: 'EMART',   stdCycleSec: 45 },
    { code: 'SRC-003', name: '니즈 간장 900ml',         category: '장류',    unit: '병',   custCode: 'LOTTE',   stdCycleSec: 40 },
    { code: 'SRC-004', name: '니즈 쌈장 170g',          category: '장류',    unit: '컵',   custCode: 'HOMEPLUS', stdCycleSec: 35 },
    // 소스류
    { code: 'SAU-001', name: '니즈 불고기 소스 840g',   category: '소스류',  unit: '병',   custCode: 'EMART',   stdCycleSec: 50 },
    { code: 'SAU-002', name: '니즈 데리야끼 소스 500g', category: '소스류',  unit: '병',   custCode: 'LOTTE',   stdCycleSec: 50 },
    { code: 'SAU-003', name: '니즈 굴소스 500g',        category: '소스류',  unit: '병',   custCode: 'COUPANG', stdCycleSec: 48 },
    { code: 'SAU-004', name: '니즈 스테이크 소스 250g', category: '소스류',  unit: '병',   custCode: 'HYUNDAI', stdCycleSec: 52 },
    // 드레싱류
    { code: 'DRS-001', name: '니즈 참깨 드레싱 200ml',  category: '드레싱류', unit: '병',   custCode: 'EMART',   stdCycleSec: 42 },
    { code: 'DRS-002', name: '니즈 이탈리안 드레싱 200ml', category: '드레싱류', unit: '병', custCode: 'LOTTE', stdCycleSec: 42 },
    { code: 'DRS-003', name: '니즈 발사믹 드레싱 200ml', category: '드레싱류', unit: '병',  custCode: 'HYUNDAI', stdCycleSec: 42 },
    // 즉석식품
    { code: 'RTE-001', name: '니즈 순두부찌개 450g (레토르트)', category: '즉석식품', unit: '봉', custCode: 'COUPANG', stdCycleSec: 120 },
    { code: 'RTE-002', name: '니즈 된장찌개 450g (레토르트)',   category: '즉석식품', unit: '봉', custCode: 'EMART',   stdCycleSec: 120 },
    { code: 'RTE-003', name: '니즈 갈비찜 400g (레토르트)',     category: '즉석식품', unit: '봉', custCode: 'LOTTE',   stdCycleSec: 130 },
    // 수출품
    { code: 'EXP-001', name: '니즈 고추장 500g (수출용)',       category: '장류',    unit: '병', custCode: 'EXPORT',  stdCycleSec: 45 },
    { code: 'EXP-002', name: '니즈 불고기 소스 840g (수출용)', category: '소스류',   unit: '병', custCode: 'EXPORT',  stdCycleSec: 50 },
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

  // ── 공정 (식품 제조 공정) ────────────────────────────
  const processData = [
    // 소스류 공통 공정 (불고기 소스)
    { code: 'P-SAU001-010', name: '원료 계량',     seq: 1, productCode: 'SAU-001' },
    { code: 'P-SAU001-020', name: '배합/혼합',     seq: 2, productCode: 'SAU-001', equipCode: 'MIX-001' },
    { code: 'P-SAU001-030', name: '살균 (85℃/30min)', seq: 3, productCode: 'SAU-001', equipCode: 'PAS-001' },
    { code: 'P-SAU001-040', name: '냉각 (10℃이하)', seq: 4, productCode: 'SAU-001', equipCode: 'COL-001' },
    { code: 'P-SAU001-050', name: '충전/밀봉',     seq: 5, productCode: 'SAU-001', equipCode: 'FIL-001' },
    { code: 'P-SAU001-060', name: '금속검출',      seq: 6, productCode: 'SAU-001', equipCode: 'MTL-001' },
    { code: 'P-SAU001-070', name: '포장/라벨링',   seq: 7, productCode: 'SAU-001', equipCode: 'PKG-001' },
    { code: 'P-SAU001-080', name: '출하검사',      seq: 8, productCode: 'SAU-001' },
    // 고추장 공정
    { code: 'P-SRC001-010', name: '원료 계량',     seq: 1, productCode: 'SRC-001' },
    { code: 'P-SRC001-020', name: '배합/숙성',     seq: 2, productCode: 'SRC-001', equipCode: 'MIX-001' },
    { code: 'P-SRC001-030', name: '살균',          seq: 3, productCode: 'SRC-001', equipCode: 'PAS-001' },
    { code: 'P-SRC001-040', name: '냉각',          seq: 4, productCode: 'SRC-001', equipCode: 'COL-001' },
    { code: 'P-SRC001-050', name: '충전/밀봉',     seq: 5, productCode: 'SRC-001', equipCode: 'FIL-001' },
    { code: 'P-SRC001-060', name: '금속검출',      seq: 6, productCode: 'SRC-001', equipCode: 'MTL-001' },
    { code: 'P-SRC001-070', name: '포장',          seq: 7, productCode: 'SRC-001', equipCode: 'PKG-001' },
    { code: 'P-SRC001-080', name: '출하검사',      seq: 8, productCode: 'SRC-001' },
    // 간장 공정
    { code: 'P-SRC003-010', name: '원료 계량',     seq: 1, productCode: 'SRC-003' },
    { code: 'P-SRC003-020', name: '배합',          seq: 2, productCode: 'SRC-003', equipCode: 'MIX-002' },
    { code: 'P-SRC003-030', name: '살균 (UHT)',    seq: 3, productCode: 'SRC-003', equipCode: 'PAS-002' },
    { code: 'P-SRC003-040', name: '냉각',          seq: 4, productCode: 'SRC-003', equipCode: 'COL-002' },
    { code: 'P-SRC003-050', name: '충전 (유리병)', seq: 5, productCode: 'SRC-003', equipCode: 'FIL-003' },
    { code: 'P-SRC003-060', name: '금속검출/X-RAY', seq: 6, productCode: 'SRC-003', equipCode: 'XRY-001' },
    { code: 'P-SRC003-070', name: '포장',          seq: 7, productCode: 'SRC-003', equipCode: 'PKG-002' },
    { code: 'P-SRC003-080', name: '출하검사',      seq: 8, productCode: 'SRC-003' },
    // 레토르트 즉석식품 (순두부찌개)
    { code: 'P-RTE001-010', name: '원료 전처리',   seq: 1, productCode: 'RTE-001' },
    { code: 'P-RTE001-020', name: '배합/가열',     seq: 2, productCode: 'RTE-001', equipCode: 'MIX-003' },
    { code: 'P-RTE001-030', name: '충전/밀봉 (파우치)', seq: 3, productCode: 'RTE-001', equipCode: 'FIL-002' },
    { code: 'P-RTE001-040', name: '레토르트 살균 (121℃/40min)', seq: 4, productCode: 'RTE-001', equipCode: 'RTT-001' },
    { code: 'P-RTE001-050', name: '냉각',          seq: 5, productCode: 'RTE-001', equipCode: 'COL-001' },
    { code: 'P-RTE001-060', name: '금속검출/X-RAY', seq: 6, productCode: 'RTE-001', equipCode: 'XRY-001' },
    { code: 'P-RTE001-070', name: '포장/라벨링',   seq: 7, productCode: 'RTE-001', equipCode: 'PKG-003' },
    { code: 'P-RTE001-080', name: '출하검사',      seq: 8, productCode: 'RTE-001' },
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

  // ── 원료/원자재 ──────────────────────────────────────
  const materialData = [
    // 주요 원료
    { code: 'RM-001', name: '고추가루 (국산)',     unit: 'KG', spec: '태양초 1등급',           supplier: '(주)국산고추', safetyStock: 500 },
    { code: 'RM-002', name: '정제염',             unit: 'KG', spec: '식품용 정제염',           supplier: '한주소금(주)', safetyStock: 1000 },
    { code: 'RM-003', name: '원당 (설탕)',         unit: 'KG', spec: '정백당 1등품',            supplier: '삼양사(주)',   safetyStock: 800 },
    { code: 'RM-004', name: '간장 (원액)',         unit: 'L',  spec: '양조간장 원액',           supplier: '샘표식품(주)', safetyStock: 500 },
    { code: 'RM-005', name: '마늘 (다진)',         unit: 'KG', spec: '국산 냉동마늘',           supplier: '농협',        safetyStock: 200 },
    { code: 'RM-006', name: '생강 (다진)',         unit: 'KG', spec: '국산 냉동생강',           supplier: '농협',        safetyStock: 100 },
    { code: 'RM-007', name: '참기름',             unit: 'L',  spec: '식품용 참기름',           supplier: '오뚜기(주)',   safetyStock: 100 },
    { code: 'RM-008', name: '식용유 (콩기름)',     unit: 'L',  spec: '식품용 대두유',           supplier: '삼양사(주)',   safetyStock: 300 },
    { code: 'RM-009', name: '전분 (옥수수)',       unit: 'KG', spec: '식품용 옥수수전분',       supplier: '(주)삼화',    safetyStock: 300 },
    { code: 'RM-010', name: '물엿',               unit: 'KG', spec: '식품용 물엿',             supplier: '대상(주)',     safetyStock: 400 },
    { code: 'RM-011', name: '참깨',               unit: 'KG', spec: '볶음참깨',                supplier: '농협',        safetyStock: 100 },
    { code: 'RM-012', name: '된장 원액',          unit: 'KG', spec: '전통된장 원액',           supplier: '샘표식품(주)', safetyStock: 300 },
    { code: 'RM-013', name: '고추씨',             unit: 'KG', spec: '식품용 고추씨',           supplier: '(주)국산고추', safetyStock: 100 },
    { code: 'RM-014', name: '양파 (분말)',         unit: 'KG', spec: '식품용 양파분말',         supplier: '(주)청정무역', safetyStock: 100 },
    // 포장재
    { code: 'PK-001', name: 'PET병 500ml',        unit: 'EA', spec: '식품용 PET 500ml',       supplier: '(주)대웅용기', safetyStock: 10000 },
    { code: 'PK-002', name: '파우치 450g용',      unit: 'EA', spec: '레토르트 파우치',         supplier: '(주)포장재료', safetyStock: 10000 },
    { code: 'PK-003', name: '유리병 900ml',       unit: 'EA', spec: '식품용 유리병',           supplier: '(주)한국유리', safetyStock: 5000 },
    { code: 'PK-004', name: '뚜껑 (캡)',          unit: 'EA', spec: '식품용 PP캡',             supplier: '(주)대웅용기', safetyStock: 20000 },
    { code: 'PK-005', name: '라벨 (스티커)',      unit: 'EA', spec: '식품용 라벨지',           supplier: '(주)레이블코', safetyStock: 30000 },
    { code: 'PK-006', name: '박스 (20입용)',      unit: 'EA', spec: '외포장 골판지박스',       supplier: '(주)한국상자', safetyStock: 2000 },
  ];
  for (const m of materialData) {
    await prisma.material.upsert({ where: { code: m.code }, update: {}, create: m });
  }
  console.log(`✅ 원료/원자재 ${materialData.length}개 완료`);

  // ── Sequence 초기화 ──────────────────────────────────
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequences = [
    { prefix: 'WO', lastDate: today },
    { prefix: 'NCR', lastDate: today },
    { prefix: 'SHP', lastDate: today },
    { prefix: 'SO', lastDate: today },
  ];
  for (const s of sequences) {
    await prisma.sequence.upsert({
      where: { prefix: s.prefix },
      update: {},
      create: { prefix: s.prefix, currentVal: 0, lastDate: s.lastDate },
    });
  }
  console.log(`✅ Sequence ${sequences.length}개 완료`);

  console.log('');
  console.log('🎉 니즈푸드 기본데이터 입력 완료!');
  console.log('   - 계정 7개 / 거래처 6개 / 설비 19개 / 제품 16개 / 공정 32개 / 원료 20개');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
