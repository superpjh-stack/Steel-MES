/**
 * seed-full.mjs — 니즈푸드 전 메뉴 데모 데이터 (식품 도메인 포함)
 * 실행: node prisma/seed-full.mjs
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 날짜 헬퍼 ──────────────────────────────────────────────────────────────
const d = (s) => new Date(s);
const today = '2026-02-21';

async function main() {
  console.log('🌱 니즈푸드 전 메뉴 데모 데이터 입력 시작...\n');

  // ── 기존 레퍼런스 로드 ──────────────────────────────────────────────────
  const admin     = await prisma.user.findUnique({ where: { email: 'admin@mes.local' } });
  const manager   = await prisma.user.findUnique({ where: { email: 'manager@mes.local' } });
  const operator1 = await prisma.user.findUnique({ where: { email: 'operator1@mes.local' } });
  const operator2 = await prisma.user.findUnique({ where: { email: 'operator2@mes.local' } });
  const qc1       = await prisma.user.findUnique({ where: { email: 'qc1@mes.local' } });
  const qc2       = await prisma.user.findUnique({ where: { email: 'qc2@mes.local' } });

  if (!admin || !manager || !operator1 || !qc1) {
    throw new Error('기본 사용자가 없습니다. 먼저 seed-kwangsung.mjs 를 실행하세요.');
  }

  // ── 1. 고객사 추가 (5 → 10개) ──────────────────────────────────────────
  const newCustomers = [
    { code: 'HDT', name: '현대트랜시스(주)',     contact: '구매1팀',  otdTarget: 97 },
    { code: 'MBK', name: '만도(주)',             contact: '협력구매팀', otdTarget: 96 },
    { code: 'HMO', name: '현대모비스(주)',       contact: '구매2팀',  otdTarget: 98 },
    { code: 'WIA', name: 'WIA(주)',              contact: '구매팀',   otdTarget: 95 },
    { code: 'SLA', name: '쌍용자동차부품(주)',   contact: '구매팀',   otdTarget: 94 },
  ];
  for (const c of newCustomers) {
    await prisma.customer.upsert({ where: { code: c.code }, update: {}, create: c });
  }
  console.log(`✅ 고객사 추가 ${newCustomers.length}개 (총 10개)`);

  // 고객사 맵 로드
  const allCustomers = await prisma.customer.findMany();
  const custMap = Object.fromEntries(allCustomers.map(c => [c.code, c]));

  // ── 2. 원자재 추가 (7 → 10개) ──────────────────────────────────────────
  const newMaterials = [
    { code: 'MAT-008', name: 'SPFC 고강도 강판 t2.3', unit: 'KG', spec: 'SPFC590 t2.3 x 1000W', safetyStock: 2000 },
    { code: 'MAT-009', name: '방청 프라이머 (회색)',   unit: 'L',  spec: '수용성 방청도료',       safetyStock: 200  },
    { code: 'MAT-010', name: '케이블 와이어 ø2.0',    unit: 'M',  spec: 'SWM-B ø2.0mm Roll',   safetyStock: 5000 },
  ];
  for (const m of newMaterials) {
    await prisma.material.upsert({ where: { code: m.code }, update: {}, create: m });
  }
  console.log(`✅ 원자재 추가 ${newMaterials.length}개 (총 10개)`);

  // 원자재 맵 로드
  const allMaterials = await prisma.material.findMany();
  const matMap = Object.fromEntries(allMaterials.map(m => [m.code, m]));

  // 제품·설비·공정 맵 로드
  const allProducts  = await prisma.product.findMany();
  const allEquip     = await prisma.equipment.findMany();
  const allProcesses = await prisma.process.findMany({ include: { product: true, equipment: true } });
  const prodMap  = Object.fromEntries(allProducts.map(p => [p.code, p]));
  const equipMap = Object.fromEntries(allEquip.map(e => [e.code, e]));

  // ── 3. 공통코드 (10개) ─────────────────────────────────────────────────
  const commonCodes = [
    { groupCode: 'UNIT', groupName: '단위',         code: 'EA',    codeName: '개',         sortOrder: 1 },
    { groupCode: 'UNIT', groupName: '단위',         code: 'KG',    codeName: '킬로그램',   sortOrder: 2 },
    { groupCode: 'UNIT', groupName: '단위',         code: 'L',     codeName: '리터',       sortOrder: 3 },
    { groupCode: 'UNIT', groupName: '단위',         code: 'M',     codeName: '미터',       sortOrder: 4 },
    { groupCode: 'UNIT', groupName: '단위',         code: 'SET',   codeName: '세트',       sortOrder: 5 },
    { groupCode: 'MAT_TYPE', groupName: '원자재유형', code: 'STEEL', codeName: '강판류',     sortOrder: 1 },
    { groupCode: 'MAT_TYPE', groupName: '원자재유형', code: 'WIRE',  codeName: '와이어류',   sortOrder: 2 },
    { groupCode: 'MAT_TYPE', groupName: '원자재유형', code: 'COAT',  codeName: '도료류',     sortOrder: 3 },
    { groupCode: 'SHIFT',    groupName: '교대구분',   code: '1ST',   codeName: '1교대(주간)', sortOrder: 1 },
    { groupCode: 'SHIFT',    groupName: '교대구분',   code: '2ND',   codeName: '2교대(야간)', sortOrder: 2 },
  ];
  for (const c of commonCodes) {
    await prisma.commonCode.upsert({
      where: { groupCode_code: { groupCode: c.groupCode, code: c.code } },
      update: {},
      create: c,
    });
  }
  console.log(`✅ 공통코드 ${commonCodes.length}개`);

  // ── 4. 인터페이스 장치 (10개) ──────────────────────────────────────────
  const ifaces = [
    { name: 'A라인 바코드 리더 #1',    devType: 'barcode_reader', protocol: 'serial', host: null,            port: null, description: 'Transfer Press A-1 투입부 바코드' },
    { name: 'A라인 바코드 리더 #2',    devType: 'barcode_reader', protocol: 'serial', host: null,            port: null, description: 'Transfer Press A-2 투입부 바코드' },
    { name: 'B라인 PLC (TRF-003)',     devType: 'plc',            protocol: 'modbus', host: '192.168.1.10',  port: 502,  description: 'Shuttle Robot Line PLC' },
    { name: 'D라인 용접 PLC',          devType: 'plc',            protocol: 'modbus', host: '192.168.1.20',  port: 502,  description: 'Spot/CO2 용접 라인 PLC' },
    { name: 'F라인 조립 PLC',          devType: 'plc',            protocol: 'opc_ua', host: '192.168.1.30',  port: 4840, description: '파킹브레이크 조립 OPC-UA' },
    { name: '전착도장 라인 PLC',        devType: 'plc',            protocol: 'modbus', host: '192.168.1.40',  port: 502,  description: '전착도장 E라인 PLC' },
    { name: '계중기 #1 (투입원자재)',   devType: 'scale',          protocol: 'serial', host: null,            port: null, description: '원자재 입고 계중기' },
    { name: '계중기 #2 (완제품)',       devType: 'scale',          protocol: 'serial', host: null,            port: null, description: '완제품 출하 계중기' },
    { name: 'RFID 리더 (출하창고)',     devType: 'rfid',           protocol: 'tcp',    host: '192.168.1.50',  port: 9000, description: '출하창고 입출고 RFID' },
    { name: '온습도 센서 (도장라인)',   devType: 'sensor',         protocol: 'mqtt',   host: '192.168.1.100', port: 1883, description: '전착도장 환경 모니터링' },
  ];
  for (const iface of ifaces) {
    const exists = await prisma.interfaceDevice.findFirst({ where: { name: iface.name } });
    if (!exists) await prisma.interfaceDevice.create({ data: iface });
  }
  console.log(`✅ 인터페이스 장치 ${ifaces.length}개`);

  // ── 5. 수주 (SalesOrder, 10개) ─────────────────────────────────────────
  const soList = [
    { soNo: 'SO-20260201-001', custCode: 'HMC', prodCode: 'BRK-001', orderedQty: 5000, dueDate: d('2026-02-28'), status: 'completed' },
    { soNo: 'SO-20260201-002', custCode: 'HMC', prodCode: 'BRK-002', orderedQty: 5000, dueDate: d('2026-02-28'), status: 'completed' },
    { soNo: 'SO-20260201-003', custCode: 'KIA', prodCode: 'BRK-003', orderedQty: 3000, dueDate: d('2026-03-05'), status: 'in_production' },
    { soNo: 'SO-20260201-004', custCode: 'KIA', prodCode: 'BRK-004', orderedQty: 3000, dueDate: d('2026-03-05'), status: 'in_production' },
    { soNo: 'SO-20260201-005', custCode: 'GMK', prodCode: 'BRK-005', orderedQty: 2000, dueDate: d('2026-03-10'), status: 'confirmed' },
    { soNo: 'SO-20260201-006', custCode: 'HMC', prodCode: 'STR-001', orderedQty: 1000, dueDate: d('2026-03-15'), status: 'confirmed' },
    { soNo: 'SO-20260201-007', custCode: 'KIA', prodCode: 'STR-002', orderedQty: 2000, dueDate: d('2026-03-20'), status: 'received' },
    { soNo: 'SO-20260201-008', custCode: 'RSM', prodCode: 'FBK-001', orderedQty: 8000, dueDate: d('2026-03-25'), status: 'received' },
    { soNo: 'SO-20260201-009', custCode: 'HMC', prodCode: 'ASY-001', orderedQty: 1500, dueDate: d('2026-03-31'), status: 'received' },
    { soNo: 'SO-20260201-010', custCode: 'SSY', prodCode: 'ETC-001', orderedQty: 4000, dueDate: d('2026-04-05'), status: 'received' },
  ];
  for (const so of soList) {
    await prisma.salesOrder.upsert({
      where: { soNo: so.soNo },
      update: {},
      create: {
        soNo: so.soNo,
        customerId: custMap[so.custCode].id,
        productId:  prodMap[so.prodCode].id,
        orderedQty: so.orderedQty,
        dueDate:    so.dueDate,
        status:     so.status,
        createdById: manager.id,
      },
    });
  }
  console.log(`✅ 수주 ${soList.length}개`);

  // ── 6. 작업지시 (WorkOrder, 10개) ──────────────────────────────────────
  const woList = [
    { woNo: 'WO-20260201-001', prodCode: 'BRK-001', custCode: 'HMC', plannedQty: 2500, producedQty: 2500, defectQty: 12, status: 'completed', plannedStart: d('2026-02-03 08:00'), plannedEnd: d('2026-02-05 17:00'), actualStart: d('2026-02-03 08:10'), actualEnd: d('2026-02-05 16:45'), dueDate: d('2026-02-06'), priority: 1 },
    { woNo: 'WO-20260201-002', prodCode: 'BRK-002', custCode: 'HMC', plannedQty: 2500, producedQty: 2500, defectQty: 8,  status: 'completed', plannedStart: d('2026-02-03 08:00'), plannedEnd: d('2026-02-05 17:00'), actualStart: d('2026-02-03 08:15'), actualEnd: d('2026-02-05 17:00'), dueDate: d('2026-02-06'), priority: 1 },
    { woNo: 'WO-20260201-003', prodCode: 'BRK-003', custCode: 'KIA', plannedQty: 1500, producedQty: 980,  defectQty: 15, status: 'in_progress', plannedStart: d('2026-02-10 08:00'), plannedEnd: d('2026-02-14 17:00'), actualStart: d('2026-02-10 08:00'), actualEnd: null, dueDate: d('2026-03-05'), priority: 2 },
    { woNo: 'WO-20260201-004', prodCode: 'BRK-004', custCode: 'KIA', plannedQty: 1500, producedQty: 720,  defectQty: 10, status: 'in_progress', plannedStart: d('2026-02-10 08:00'), plannedEnd: d('2026-02-14 17:00'), actualStart: d('2026-02-10 08:05'), actualEnd: null, dueDate: d('2026-03-05'), priority: 2 },
    { woNo: 'WO-20260201-005', prodCode: 'BRK-005', custCode: 'GMK', plannedQty: 1000, producedQty: 350,  defectQty: 5,  status: 'in_progress', plannedStart: d('2026-02-17 08:00'), plannedEnd: d('2026-02-19 17:00'), actualStart: d('2026-02-17 08:00'), actualEnd: null, dueDate: d('2026-03-10'), priority: 3 },
    { woNo: 'WO-20260201-006', prodCode: 'STR-001', custCode: 'HMC', plannedQty: 500,  producedQty: 0,    defectQty: 0,  status: 'issued',      plannedStart: d('2026-02-24 08:00'), plannedEnd: d('2026-02-26 17:00'), actualStart: null, actualEnd: null, dueDate: d('2026-03-15'), priority: 3 },
    { woNo: 'WO-20260201-007', prodCode: 'STR-002', custCode: 'KIA', plannedQty: 1000, producedQty: 0,    defectQty: 0,  status: 'issued',      plannedStart: d('2026-02-24 08:00'), plannedEnd: d('2026-02-27 17:00'), actualStart: null, actualEnd: null, dueDate: d('2026-03-20'), priority: 4 },
    { woNo: 'WO-20260201-008', prodCode: 'FBK-001', custCode: 'RSM', plannedQty: 4000, producedQty: 0,    defectQty: 0,  status: 'draft',       plannedStart: d('2026-03-03 08:00'), plannedEnd: d('2026-03-07 17:00'), actualStart: null, actualEnd: null, dueDate: d('2026-03-25'), priority: 5 },
    { woNo: 'WO-20260201-009', prodCode: 'ASY-001', custCode: 'HMC', plannedQty: 750,  producedQty: 0,    defectQty: 0,  status: 'draft',       plannedStart: d('2026-03-10 08:00'), plannedEnd: d('2026-03-14 17:00'), actualStart: null, actualEnd: null, dueDate: d('2026-03-31'), priority: 5 },
    { woNo: 'WO-20260201-010', prodCode: 'ETC-001', custCode: 'SSY', plannedQty: 2000, producedQty: 0,    defectQty: 0,  status: 'draft',       plannedStart: d('2026-03-17 08:00'), plannedEnd: d('2026-03-19 17:00'), actualStart: null, actualEnd: null, dueDate: d('2026-04-05'), priority: 6 },
  ];
  for (const wo of woList) {
    await prisma.workOrder.upsert({
      where: { woNo: wo.woNo },
      update: {},
      create: {
        woNo: wo.woNo,
        productId:    prodMap[wo.prodCode].id,
        customerId:   custMap[wo.custCode].id,
        plannedQty:   wo.plannedQty,
        producedQty:  wo.producedQty,
        defectQty:    wo.defectQty,
        status:       wo.status,
        plannedStart: wo.plannedStart,
        plannedEnd:   wo.plannedEnd,
        actualStart:  wo.actualStart,
        actualEnd:    wo.actualEnd,
        dueDate:      wo.dueDate,
        priority:     wo.priority,
        createdById:  manager.id,
      },
    });
  }
  console.log(`✅ 작업지시 ${woList.length}개`);

  // 작업지시 맵 로드
  const allWo = await prisma.workOrder.findMany();
  const woMap = Object.fromEntries(allWo.map(w => [w.woNo, w]));

  // 공정 맵 (productId 기준으로 첫 공정 찾기)
  function findFirstProcess(prodCode) {
    return allProcesses
      .filter(p => p.product?.code === prodCode)
      .sort((a, b) => a.seq - b.seq)[0];
  }
  function findProcessWithEquip(prodCode) {
    return allProcesses
      .filter(p => p.product?.code === prodCode && p.equipment)
      .sort((a, b) => a.seq - b.seq)[0];
  }

  // ── 7. 생산 로그 (ProductionLog, 10개) ────────────────────────────────
  const proc1 = findProcessWithEquip('BRK-001');
  const proc2 = findProcessWithEquip('BRK-002');
  const proc3 = findProcessWithEquip('BRK-003');
  const proc4 = findProcessWithEquip('BRK-004');
  const proc5 = findProcessWithEquip('BRK-005');

  const prodLogs = [
    { woNo: 'WO-20260201-001', proc: proc1, equip: equipMap['TRF-001'], lotNo: 'LOT-BRK001-2602031', plannedQty: 1250, goodQty: 1240, defectQty: 10, startTime: d('2026-02-03 08:10'), endTime: d('2026-02-03 17:00'), cycleTimeSec: 38 },
    { woNo: 'WO-20260201-001', proc: proc1, equip: equipMap['TRF-001'], lotNo: 'LOT-BRK001-2602041', plannedQty: 1250, goodQty: 1248, defectQty: 2,  startTime: d('2026-02-04 08:00'), endTime: d('2026-02-04 17:00'), cycleTimeSec: 38 },
    { woNo: 'WO-20260201-002', proc: proc2, equip: equipMap['TRF-001'], lotNo: 'LOT-BRK002-2602031', plannedQty: 1250, goodQty: 1246, defectQty: 4,  startTime: d('2026-02-03 08:15'), endTime: d('2026-02-03 17:00'), cycleTimeSec: 38 },
    { woNo: 'WO-20260201-002', proc: proc2, equip: equipMap['TRF-001'], lotNo: 'LOT-BRK002-2602041', plannedQty: 1250, goodQty: 1246, defectQty: 4,  startTime: d('2026-02-04 08:00'), endTime: d('2026-02-04 17:00'), cycleTimeSec: 38 },
    { woNo: 'WO-20260201-003', proc: proc3, equip: equipMap['TRF-002'], lotNo: 'LOT-BRK003-2602101', plannedQty: 500,  goodQty: 490,  defectQty: 10, startTime: d('2026-02-10 08:00'), endTime: d('2026-02-10 17:00'), cycleTimeSec: 55 },
    { woNo: 'WO-20260201-003', proc: proc3, equip: equipMap['TRF-002'], lotNo: 'LOT-BRK003-2602111', plannedQty: 500,  goodQty: 495,  defectQty: 5,  startTime: d('2026-02-11 08:00'), endTime: d('2026-02-11 17:00'), cycleTimeSec: 55 },
    { woNo: 'WO-20260201-004', proc: proc4, equip: equipMap['TRF-002'], lotNo: 'LOT-BRK004-2602101', plannedQty: 360,  goodQty: 356,  defectQty: 4,  startTime: d('2026-02-10 08:05'), endTime: d('2026-02-10 17:00'), cycleTimeSec: 55 },
    { woNo: 'WO-20260201-004', proc: proc4, equip: equipMap['TRF-002'], lotNo: 'LOT-BRK004-2602111', plannedQty: 360,  goodQty: 358,  defectQty: 2,  startTime: d('2026-02-11 08:05'), endTime: d('2026-02-11 17:00'), cycleTimeSec: 55 },
    { woNo: 'WO-20260201-005', proc: proc5, equip: equipMap['SHT-001'], lotNo: 'LOT-BRK005-2602171', plannedQty: 350,  goodQty: 345,  defectQty: 5,  startTime: d('2026-02-17 08:00'), endTime: d('2026-02-17 17:00'), cycleTimeSec: 72 },
    { woNo: 'WO-20260201-005', proc: proc5, equip: equipMap['SHT-001'], lotNo: 'LOT-BRK005-2602181', plannedQty: 350,  goodQty: 350,  defectQty: 0,  startTime: d('2026-02-18 08:00'), endTime: d('2026-02-18 17:00'), cycleTimeSec: 72 },
  ].filter(l => l.proc && l.equip);

  const savedLogs = [];
  for (const log of prodLogs) {
    const exists = await prisma.productionLog.findFirst({ where: { lotNo: log.lotNo } });
    if (!exists) {
      const saved = await prisma.productionLog.create({
        data: {
          workOrderId:  woMap[log.woNo].id,
          processId:    log.proc.id,
          equipmentId:  log.equip.id,
          operatorId:   operator1.id,
          lotNo:        log.lotNo,
          plannedQty:   log.plannedQty,
          goodQty:      log.goodQty,
          defectQty:    log.defectQty,
          startTime:    log.startTime,
          endTime:      log.endTime,
          cycleTimeSec: log.cycleTimeSec,
        },
      });
      savedLogs.push(saved);
    } else {
      savedLogs.push(exists);
    }
  }
  console.log(`✅ 생산 로그 ${prodLogs.length}개`);

  // ── 8. 불량 로그 (DefectLog, 10개) ──────────────────────────────────────
  const defectDefs = [
    { code: 'DF-001', name: '치수불량 (두께)',    disp: 'scrap',    cause: '금형 마모',           action: '금형 교체 예정' },
    { code: 'DF-002', name: '치수불량 (폭)',      disp: 'rework',   cause: '소재 폭 편차',        action: '소재 입고검사 강화' },
    { code: 'DF-003', name: '표면 스크래치',      disp: 'use_as_is',cause: '이송장치 접촉',       action: '보호패드 부착' },
    { code: 'DF-004', name: '용접 불량 (기공)',   disp: 'rework',   cause: 'CO2 유량 부족',       action: '가스 유량 조정' },
    { code: 'DF-005', name: '도장 벗겨짐',        disp: 'rework',   cause: '표면 이물질',         action: '전처리 세척 강화' },
    { code: 'DF-006', name: '크랙 (성형)',        disp: 'scrap',    cause: '소재 경도 초과',      action: '입고 경도 검사 추가' },
    { code: 'DF-007', name: '버(Burr) 불량',     disp: 'rework',   cause: '금형 클리어런스 과다', action: '클리어런스 조정' },
    { code: 'DF-008', name: '조립 누락',          disp: 'rework',   cause: '작업자 실수',         action: 'Fool-Proof 장치 설치' },
    { code: 'DF-009', name: '도금 불량',          disp: 'scrap',    cause: '도금액 농도 저하',    action: '도금액 교체' },
    { code: 'DF-010', name: '용접 강도 부족',     disp: 'scrap',    cause: '용접 전류 부족',      action: '용접 조건 재설정' },
  ];
  for (let i = 0; i < Math.min(defectDefs.length, savedLogs.length); i++) {
    const def = defectDefs[i];
    const log = savedLogs[i];
    const exists = await prisma.defectLog.findFirst({ where: { productionLogId: log.id, defectCode: def.code } });
    if (!exists && log.defectQty > 0) {
      await prisma.defectLog.create({
        data: {
          productionLogId: log.id,
          defectCode:      def.code,
          defectName:      def.name,
          qty:             1,
          disposition:     def.disp,
          rootCause:       def.cause,
          correctiveAction:def.action,
          createdById:     qc1.id,
        },
      });
    }
  }
  console.log(`✅ 불량 로그 ${defectDefs.length}개`);

  // ── 9. 검사 기록 (InspectionRecord, 10개) ──────────────────────────────
  const inspProc = allProcesses.find(p => p.product?.code === 'BRK-001') ?? allProcesses[0];
  const inspDefs = [
    { woNo: 'WO-20260201-001', type: 'incoming',   lotNo: 'LOT-BRK001-2602031', sampleQty: 50, passQty: 50, failQty: 0, result: 'pass',    date: d('2026-02-03 07:30') },
    { woNo: 'WO-20260201-001', type: 'in_process', lotNo: 'LOT-BRK001-2602031', sampleQty: 30, passQty: 28, failQty: 2, result: 'fail',    date: d('2026-02-03 12:00') },
    { woNo: 'WO-20260201-001', type: 'outgoing',   lotNo: 'LOT-BRK001-2602041', sampleQty: 50, passQty: 50, failQty: 0, result: 'pass',    date: d('2026-02-05 15:00') },
    { woNo: 'WO-20260201-002', type: 'incoming',   lotNo: 'LOT-BRK002-2602031', sampleQty: 50, passQty: 50, failQty: 0, result: 'pass',    date: d('2026-02-03 07:30') },
    { woNo: 'WO-20260201-002', type: 'outgoing',   lotNo: 'LOT-BRK002-2602041', sampleQty: 50, passQty: 49, failQty: 1, result: 'pass',    date: d('2026-02-05 15:30') },
    { woNo: 'WO-20260201-003', type: 'incoming',   lotNo: 'LOT-BRK003-2602101', sampleQty: 30, passQty: 30, failQty: 0, result: 'pass',    date: d('2026-02-10 07:30') },
    { woNo: 'WO-20260201-003', type: 'in_process', lotNo: 'LOT-BRK003-2602101', sampleQty: 20, passQty: 18, failQty: 2, result: 'fail',    date: d('2026-02-10 12:00') },
    { woNo: 'WO-20260201-004', type: 'incoming',   lotNo: 'LOT-BRK004-2602101', sampleQty: 30, passQty: 30, failQty: 0, result: 'pass',    date: d('2026-02-10 07:30') },
    { woNo: 'WO-20260201-005', type: 'incoming',   lotNo: 'LOT-BRK005-2602171', sampleQty: 20, passQty: 19, failQty: 1, result: 'pass',    date: d('2026-02-17 07:30') },
    { woNo: 'WO-20260201-005', type: 'in_process', lotNo: 'LOT-BRK005-2602171', sampleQty: 15, passQty: 15, failQty: 0, result: 'pass',    date: d('2026-02-17 12:00') },
  ];
  const savedInsp = [];
  for (const ins of inspDefs) {
    const exists = await prisma.inspectionRecord.findFirst({
      where: { lotNo: ins.lotNo, type: ins.type, workOrderId: woMap[ins.woNo].id },
    });
    if (!exists) {
      const saved = await prisma.inspectionRecord.create({
        data: {
          type:           ins.type,
          workOrderId:    woMap[ins.woNo].id,
          lotNo:          ins.lotNo,
          processId:      inspProc?.id,
          inspectorId:    qc1.id,
          sampleQty:      ins.sampleQty,
          passQty:        ins.passQty,
          failQty:        ins.failQty,
          result:         ins.result,
          inspectionDate: ins.date,
        },
      });
      savedInsp.push(saved);
    } else {
      savedInsp.push(exists);
    }
  }
  console.log(`✅ 검사 기록 ${inspDefs.length}개`);

  // ── 10. NCR (10개) ──────────────────────────────────────────────────────
  const failedInsp = savedInsp.filter((_, i) => inspDefs[i]?.result === 'fail');
  const ncrDefs = [
    { ncrNo: 'NCR-20260203-001', disp: '치수불량 2개 발생 — 현공정 스크랩 처리 후 재검사 진행',      status: 'closed'    },
    { ncrNo: 'NCR-20260210-001', disp: '용접부 기공 불량 2개 — 용접조건 재설정 후 재작업 승인',      status: 'in_review' },
    { ncrNo: 'NCR-20260203-002', disp: '소재 폭 편차 초과 — 공급업체 시정조치 요청 발행',            status: 'open'      },
    { ncrNo: 'NCR-20260211-001', disp: '크랙 발생 1건 — 소재 재검토 및 입고 검사 기준 강화',         status: 'open'      },
    { ncrNo: 'NCR-20260204-001', disp: '표면 스크래치 — 이송장치 점검 후 보호패드 부착 완료',        status: 'closed'    },
    { ncrNo: 'NCR-20260217-001', disp: '도장 벗겨짐 1건 — 전처리 세척 조건 재확인',                  status: 'open'      },
    { ncrNo: 'NCR-20260205-001', disp: '출하 검사 불합격 1건 — 전수 검사 후 출하 보류',              status: 'in_review' },
    { ncrNo: 'NCR-20260212-001', disp: '버(Burr) 과다 발생 — 금형 클리어런스 조정 완료',             status: 'closed'    },
    { ncrNo: 'NCR-20260218-001', disp: '치수 산포 증가 경향 — SPC 관리도 이상 원인 분석 중',         status: 'open'      },
    { ncrNo: 'NCR-20260220-001', disp: '고객 클레임 대응 — 현장 확인 및 재발방지 대책 수립 중',      status: 'in_review' },
  ];
  // 검사 레코드가 부족하면 첫 번째 것을 재사용
  const baseInsp = savedInsp[0] ?? (await prisma.inspectionRecord.findFirst());
  if (baseInsp) {
    for (let i = 0; i < ncrDefs.length; i++) {
      const ncr = ncrDefs[i];
      const inspId = failedInsp[i % Math.max(failedInsp.length, 1)]?.id ?? baseInsp.id;
      await prisma.nonconformanceReport.upsert({
        where: { ncrNo: ncr.ncrNo },
        update: {},
        create: {
          ncrNo:       ncr.ncrNo,
          inspectionId: inspId,
          disposition: ncr.disp,
          status:      ncr.status,
          approverId:  ncr.status === 'closed' ? manager.id : null,
          approvedAt:  ncr.status === 'closed' ? d('2026-02-06 10:00') : null,
        },
      });
    }
    console.log(`✅ NCR ${ncrDefs.length}개`);
  }

  // ── 11. SPC 측정 (10개) ────────────────────────────────────────────────
  const spcProc = allProcesses.find(p => p.product?.code === 'BRK-001' && p.equipment) ?? allProcesses[0];
  const spcEquip = spcProc?.equipment ?? allEquip[0];
  const spcWo = woMap['WO-20260201-001'];
  const spcVals = [15.82, 15.91, 15.78, 16.02, 15.95, 15.88, 15.73, 16.05, 15.90, 15.85];
  for (let i = 0; i < spcVals.length; i++) {
    const measuredAt = new Date('2026-02-03T08:00:00');
    measuredAt.setMinutes(i * 30);
    const exists = await prisma.spcMeasurement.findFirst({
      where: { processId: spcProc.id, subgroupNo: i + 1, workOrderId: spcWo.id },
    });
    if (!exists) {
      await prisma.spcMeasurement.create({
        data: {
          workOrderId:    spcWo.id,
          processId:      spcProc.id,
          equipmentId:    spcEquip?.id,
          operatorId:     operator1.id,
          characteristic: '두께 (mm)',
          usl:            16.2,
          lsl:            15.6,
          nominal:        15.9,
          measuredValue:  spcVals[i],
          measuredAt,
          subgroupNo:     i + 1,
        },
      });
    }
  }
  console.log(`✅ SPC 측정 10개`);

  // ── 12. 재고 (Inventory, 10개 제품 + 7개 원자재) ──────────────────────
  const invProducts = [
    { prodCode: 'BRK-001', qty: 230,  location: '완제품창고-A1', status: 'available' },
    { prodCode: 'BRK-002', qty: 210,  location: '완제품창고-A2', status: 'available' },
    { prodCode: 'BRK-003', qty: 980,  location: '반제품창고-B1', status: 'available' },
    { prodCode: 'BRK-004', qty: 720,  location: '반제품창고-B2', status: 'available' },
    { prodCode: 'BRK-005', qty: 350,  location: '반제품창고-B3', status: 'available' },
    { prodCode: 'STR-001', qty: 0,    location: '완제품창고-A3', status: 'available' },
    { prodCode: 'FBK-001', qty: 0,    location: '완제품창고-A4', status: 'available' },
    { prodCode: 'ASY-001', qty: 0,    location: '완제품창고-A5', status: 'available' },
    { prodCode: 'ETC-001', qty: 500,  location: '완제품창고-A6', status: 'available' },
    { prodCode: 'ETC-002', qty: 1200, location: '완제품창고-A7', status: 'available' },
  ];
  const invMaterials = [
    { matCode: 'MAT-001', qty: 8500,  location: '원자재창고-C1' },
    { matCode: 'MAT-002', qty: 4200,  location: '원자재창고-C2' },
    { matCode: 'MAT-003', qty: 6100,  location: '원자재창고-C3' },
    { matCode: 'MAT-004', qty: 1800,  location: '원자재창고-C4' },
    { matCode: 'MAT-005', qty: 620,   location: '원자재창고-C5' },
    { matCode: 'MAT-006', qty: 410,   location: '원자재창고-C6' },
    { matCode: 'MAT-007', qty: 15000, location: '원자재창고-C7' },
  ];

  const savedInvIds = [];
  for (const ip of invProducts) {
    const exists = await prisma.inventory.findFirst({ where: { productId: prodMap[ip.prodCode].id } });
    if (!exists) {
      const inv = await prisma.inventory.create({
        data: { productId: prodMap[ip.prodCode].id, qty: ip.qty, location: ip.location, status: ip.status },
      });
      savedInvIds.push(inv.id);
    } else {
      savedInvIds.push(exists.id);
    }
  }
  for (const im of invMaterials) {
    const exists = await prisma.inventory.findFirst({ where: { materialId: matMap[im.matCode].id } });
    if (!exists) {
      await prisma.inventory.create({
        data: { materialId: matMap[im.matCode].id, qty: im.qty, location: im.location, status: 'available' },
      });
    }
  }
  console.log(`✅ 재고 ${invProducts.length + invMaterials.length}개`);

  // ── 13. 입출고 이력 (InventoryMovement, 10개) ──────────────────────────
  const movements = [
    { invIdx: 0,  type: 'receipt',    qty: 2500, ref: 'WO-20260201-001' },
    { invIdx: 1,  type: 'receipt',    qty: 2500, ref: 'WO-20260201-002' },
    { invIdx: 0,  type: 'shipment',   qty: 2270, ref: 'SHP-20260206-001' },
    { invIdx: 1,  type: 'shipment',   qty: 2492, ref: 'SHP-20260206-002' },
    { invIdx: 2,  type: 'receipt',    qty: 980,  ref: 'WO-20260201-003' },
    { invIdx: 3,  type: 'receipt',    qty: 720,  ref: 'WO-20260201-004' },
    { invIdx: 4,  type: 'receipt',    qty: 350,  ref: 'WO-20260201-005' },
    { invIdx: 8,  type: 'receipt',    qty: 500,  ref: 'SO-PREV-001' },
    { invIdx: 9,  type: 'receipt',    qty: 1200, ref: 'SO-PREV-002' },
    { invIdx: 8,  type: 'shipment',   qty: 0,    ref: 'HOLD' },
  ];
  for (const mv of movements) {
    const invId = savedInvIds[mv.invIdx];
    if (!invId) continue;
    const exists = await prisma.inventoryMovement.findFirst({ where: { inventoryId: invId, referenceNo: mv.ref, movementType: mv.type } });
    if (!exists && mv.qty > 0) {
      await prisma.inventoryMovement.create({
        data: {
          inventoryId:  invId,
          movementType: mv.type,
          qty:          mv.qty,
          referenceNo:  mv.ref,
          createdById:  manager.id,
        },
      });
    }
  }
  console.log(`✅ 입출고 이력 10개`);

  // ── 14. 출하 (Shipment, 10개) ──────────────────────────────────────────
  const shipDefs = [
    { no: 'SHP-20260206-001', custCode: 'HMC', woNo: 'WO-20260201-001', prodCode: 'BRK-001', qty: 2270, plannedDate: d('2026-02-06'), actualDate: d('2026-02-06'), status: 'delivered', lotNo: 'LOT-BRK001-2602041' },
    { no: 'SHP-20260206-002', custCode: 'HMC', woNo: 'WO-20260201-002', prodCode: 'BRK-002', qty: 2492, plannedDate: d('2026-02-06'), actualDate: d('2026-02-06'), status: 'delivered', lotNo: 'LOT-BRK002-2602041' },
    { no: 'SHP-20260208-001', custCode: 'HMC', woNo: 'WO-20260201-001', prodCode: 'BRK-001', qty: 230,  plannedDate: d('2026-02-08'), actualDate: d('2026-02-08'), status: 'delivered', lotNo: 'LOT-BRK001-2602041' },
    { no: 'SHP-20260208-002', custCode: 'HMC', woNo: 'WO-20260201-002', prodCode: 'BRK-002', qty: 8,    plannedDate: d('2026-02-08'), actualDate: d('2026-02-08'), status: 'delivered', lotNo: 'LOT-BRK002-2602041' },
    { no: 'SHP-20260220-001', custCode: 'KIA', woNo: 'WO-20260201-003', prodCode: 'BRK-003', qty: 490,  plannedDate: d('2026-02-20'), actualDate: d('2026-02-20'), status: 'shipped',   lotNo: 'LOT-BRK003-2602101' },
    { no: 'SHP-20260221-001', custCode: 'KIA', woNo: 'WO-20260201-004', prodCode: 'BRK-004', qty: 356,  plannedDate: d('2026-02-21'), actualDate: null,            status: 'packed',    lotNo: 'LOT-BRK004-2602101' },
    { no: 'SHP-20260225-001', custCode: 'KIA', woNo: 'WO-20260201-003', prodCode: 'BRK-003', qty: 495,  plannedDate: d('2026-02-25'), actualDate: null,            status: 'planned',   lotNo: 'LOT-BRK003-2602111' },
    { no: 'SHP-20260225-002', custCode: 'KIA', woNo: 'WO-20260201-004', prodCode: 'BRK-004', qty: 358,  plannedDate: d('2026-02-25'), actualDate: null,            status: 'planned',   lotNo: 'LOT-BRK004-2602111' },
    { no: 'SHP-20260228-001', custCode: 'GMK', woNo: 'WO-20260201-005', prodCode: 'BRK-005', qty: 345,  plannedDate: d('2026-02-28'), actualDate: null,            status: 'planned',   lotNo: 'LOT-BRK005-2602171' },
    { no: 'SHP-20260301-001', custCode: 'GMK', woNo: 'WO-20260201-005', prodCode: 'BRK-005', qty: 350,  plannedDate: d('2026-03-01'), actualDate: null,            status: 'planned',   lotNo: 'LOT-BRK005-2602181' },
  ];
  for (const sh of shipDefs) {
    await prisma.shipment.upsert({
      where: { shipmentNo: sh.no },
      update: {},
      create: {
        shipmentNo:  sh.no,
        customerId:  custMap[sh.custCode].id,
        workOrderId: woMap[sh.woNo].id,
        productId:   prodMap[sh.prodCode].id,
        lotNo:       sh.lotNo,
        shippedQty:  sh.qty,
        plannedDate: sh.plannedDate,
        actualDate:  sh.actualDate,
        status:      sh.status,
        createdById: manager.id,
      },
    });
  }
  console.log(`✅ 출하 ${shipDefs.length}개`);

  // ── 15. 설비 유지보수 (MaintenanceRecord, 10개) ────────────────────────
  const maintDefs = [
    { equipCode: 'TRF-001', type: 'pm',         desc: '금형 교체 및 윤활 점검',          start: d('2026-02-01 08:00'), end: d('2026-02-01 10:00'), cost: 150000 },
    { equipCode: 'TRF-002', type: 'pm',         desc: '다이 세팅 및 클램프 점검',        start: d('2026-02-01 08:00'), end: d('2026-02-01 10:30'), cost: 120000 },
    { equipCode: 'SPW-001', type: 'pm',         desc: '전극 교체 및 가압력 조정',        start: d('2026-02-02 08:00'), end: d('2026-02-02 09:00'), cost: 80000  },
    { equipCode: 'CO2-001', type: 'pm',         desc: '토치 청소 및 와이어 교체',        start: d('2026-02-02 09:00'), end: d('2026-02-02 10:00'), cost: 60000  },
    { equipCode: 'CTG-001', type: 'pm',         desc: '전착도장 필터 교체',              start: d('2026-02-03 06:00'), end: d('2026-02-03 08:00'), cost: 200000 },
    { equipCode: 'PKB-001', type: 'pm',         desc: '조립치구 점검 및 에어실린더 교체', start: d('2026-02-04 08:00'), end: d('2026-02-04 09:30'), cost: 90000  },
    { equipCode: 'TRF-003', type: 'corrective', desc: '슬라이드 베어링 이상음 — 교체',   start: d('2026-02-10 14:00'), end: d('2026-02-10 17:00'), cost: 350000 },
    { equipCode: 'CO2-002', type: 'corrective', desc: '용접 토치 쇼트 — 토치 교체',      start: d('2026-02-12 09:00'), end: d('2026-02-12 11:00'), cost: 180000 },
    { equipCode: 'SHT-001', type: 'pm',         desc: '로봇 암 윤활 및 티칭 재확인',     start: d('2026-02-15 08:00'), end: d('2026-02-15 12:00'), cost: 0      },
    { equipCode: 'DCP-001', type: 'pm',         desc: '브레이크 패드 점검 및 오일 교환',  start: d('2026-02-18 08:00'), end: d('2026-02-18 10:00'), cost: 110000 },
  ];
  for (const mt of maintDefs) {
    const exists = await prisma.maintenanceRecord.findFirst({
      where: { equipmentId: equipMap[mt.equipCode].id, startTime: mt.start },
    });
    if (!exists) {
      await prisma.maintenanceRecord.create({
        data: {
          equipmentId:  equipMap[mt.equipCode].id,
          type:         mt.type,
          description:  mt.desc,
          technicianId: manager.id,
          startTime:    mt.start,
          endTime:      mt.end,
          cost:         mt.cost,
          nextPmDate:   new Date(mt.start.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log(`✅ 유지보수 ${maintDefs.length}개`);

  // ── 16. 설비 가동 로그 (EquipmentLog, 10개) ────────────────────────────
  const eqLogDefs = [
    { equipCode: 'TRF-001', logDate: d('2026-02-03'), shift: '1st', plannedMin: 480, actualMin: 475, breakdownMin: 0,  setupMin: 5,  plannedQty: 1100, actualQty: 1105, goodQty: 1100 },
    { equipCode: 'TRF-001', logDate: d('2026-02-04'), shift: '1st', plannedMin: 480, actualMin: 470, breakdownMin: 0,  setupMin: 10, plannedQty: 1100, actualQty: 1095, goodQty: 1090 },
    { equipCode: 'TRF-002', logDate: d('2026-02-10'), shift: '1st', plannedMin: 480, actualMin: 480, breakdownMin: 0,  setupMin: 0,  plannedQty: 750,  actualQty: 745,  goodQty: 740  },
    { equipCode: 'TRF-002', logDate: d('2026-02-11'), shift: '1st', plannedMin: 480, actualMin: 472, breakdownMin: 0,  setupMin: 8,  plannedQty: 750,  actualQty: 748,  goodQty: 745  },
    { equipCode: 'SHT-001', logDate: d('2026-02-17'), shift: '1st', plannedMin: 480, actualMin: 480, breakdownMin: 0,  setupMin: 0,  plannedQty: 350,  actualQty: 350,  goodQty: 348  },
    { equipCode: 'SHT-001', logDate: d('2026-02-18'), shift: '1st', plannedMin: 480, actualMin: 480, breakdownMin: 0,  setupMin: 0,  plannedQty: 350,  actualQty: 352,  goodQty: 352  },
    { equipCode: 'SPW-001', logDate: d('2026-02-10'), shift: '1st', plannedMin: 480, actualMin: 465, breakdownMin: 15, setupMin: 0,  plannedQty: 800,  actualQty: 775,  goodQty: 772  },
    { equipCode: 'CO2-001', logDate: d('2026-02-03'), shift: '1st', plannedMin: 480, actualMin: 478, breakdownMin: 0,  setupMin: 2,  plannedQty: 900,  actualQty: 892,  goodQty: 890  },
    { equipCode: 'PKB-001', logDate: d('2026-02-03'), shift: '1st', plannedMin: 480, actualMin: 480, breakdownMin: 0,  setupMin: 0,  plannedQty: 600,  actualQty: 598,  goodQty: 597  },
    { equipCode: 'CTG-001', logDate: d('2026-02-03'), shift: '1st', plannedMin: 480, actualMin: 480, breakdownMin: 0,  setupMin: 0,  plannedQty: 1500, actualQty: 1498, goodQty: 1495 },
  ];
  for (const el of eqLogDefs) {
    const exists = await prisma.equipmentLog.findFirst({
      where: { equipmentId: equipMap[el.equipCode].id, logDate: el.logDate, shift: el.shift },
    });
    if (!exists) {
      await prisma.equipmentLog.create({
        data: {
          equipmentId:   equipMap[el.equipCode].id,
          logDate:       el.logDate,
          shift:         el.shift,
          plannedTimeMin: el.plannedMin,
          actualTimeMin:  el.actualMin,
          breakdownMin:   el.breakdownMin,
          setupMin:       el.setupMin,
          plannedQty:     el.plannedQty,
          actualQty:      el.actualQty,
          goodQty:        el.goodQty,
        },
      });
    }
  }
  console.log(`✅ 설비 가동 로그 ${eqLogDefs.length}개`);

  // ── 17. LOT 추적 (LotTraceability, 10개) ──────────────────────────────
  const lotDefs = [
    { lotNo: 'LOT-BRK001-2602031', matCode: 'MAT-001', matLot: 'ML-SPCC-2601001', woNo: 'WO-20260201-001', prodCode: 'BRK-001', qty: 1240, status: 'shipped'   },
    { lotNo: 'LOT-BRK001-2602041', matCode: 'MAT-001', matLot: 'ML-SPCC-2601001', woNo: 'WO-20260201-001', prodCode: 'BRK-001', qty: 1248, status: 'shipped'   },
    { lotNo: 'LOT-BRK002-2602031', matCode: 'MAT-001', matLot: 'ML-SPCC-2601001', woNo: 'WO-20260201-002', prodCode: 'BRK-002', qty: 1246, status: 'shipped'   },
    { lotNo: 'LOT-BRK002-2602041', matCode: 'MAT-001', matLot: 'ML-SPCC-2601001', woNo: 'WO-20260201-002', prodCode: 'BRK-002', qty: 1246, status: 'shipped'   },
    { lotNo: 'LOT-BRK003-2602101', matCode: 'MAT-002', matLot: 'ML-SPCC-2601002', woNo: 'WO-20260201-003', prodCode: 'BRK-003', qty: 490,  status: 'shipped'   },
    { lotNo: 'LOT-BRK003-2602111', matCode: 'MAT-002', matLot: 'ML-SPCC-2601002', woNo: 'WO-20260201-003', prodCode: 'BRK-003', qty: 495,  status: 'available' },
    { lotNo: 'LOT-BRK004-2602101', matCode: 'MAT-002', matLot: 'ML-SPCC-2601002', woNo: 'WO-20260201-004', prodCode: 'BRK-004', qty: 356,  status: 'wip'       },
    { lotNo: 'LOT-BRK004-2602111', matCode: 'MAT-002', matLot: 'ML-SPCC-2601002', woNo: 'WO-20260201-004', prodCode: 'BRK-004', qty: 358,  status: 'wip'       },
    { lotNo: 'LOT-BRK005-2602171', matCode: 'MAT-003', matLot: 'ML-SPHC-2601001', woNo: 'WO-20260201-005', prodCode: 'BRK-005', qty: 345,  status: 'wip'       },
    { lotNo: 'LOT-BRK005-2602181', matCode: 'MAT-003', matLot: 'ML-SPHC-2601001', woNo: 'WO-20260201-005', prodCode: 'BRK-005', qty: 350,  status: 'wip'       },
  ];
  for (const lot of lotDefs) {
    await prisma.lotTraceability.upsert({
      where: { lotNo: lot.lotNo },
      update: {},
      create: {
        lotNo:       lot.lotNo,
        materialId:  matMap[lot.matCode].id,
        materialLot: lot.matLot,
        workOrderId: woMap[lot.woNo].id,
        productId:   prodMap[lot.prodCode].id,
        qty:         lot.qty,
        status:      lot.status,
      },
    });
  }
  console.log(`✅ LOT 추적 ${lotDefs.length}개`);

  // ── 18. Sequence 초기화 ────────────────────────────────────────────────
  const seqDate = '20260221';
  const seqData = [
    { prefix: 'WO',  currentVal: 10, lastDate: '20260201' },
    { prefix: 'SO',  currentVal: 10, lastDate: '20260201' },
    { prefix: 'SHP', currentVal: 10, lastDate: '20260206' },
    { prefix: 'NCR', currentVal: 10, lastDate: '20260220' },
  ];
  for (const s of seqData) {
    await prisma.sequence.upsert({
      where: { prefix: s.prefix },
      update: {},
      create: s,
    });
  }
  console.log(`✅ Sequence 초기화 완료`);

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 식품 전용 데모 데이터 ────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n🍽️  식품 전용 데이터 입력 시작...\n');

  // ── 알레르기 코드 마스터 (식품위생법 21종 중 주요 항목) ──────────────────
  const allergenDefs = [
    { code: 'ALG-001', name: '대두(콩)',      nameEn: 'Soybean' },
    { code: 'ALG-002', name: '밀',            nameEn: 'Wheat' },
    { code: 'ALG-003', name: '우유',          nameEn: 'Milk' },
    { code: 'ALG-004', name: '계란',          nameEn: 'Egg' },
    { code: 'ALG-005', name: '땅콩',          nameEn: 'Peanut' },
    { code: 'ALG-006', name: '새우',          nameEn: 'Shrimp' },
    { code: 'ALG-007', name: '게',            nameEn: 'Crab' },
    { code: 'ALG-008', name: '돼지고기',      nameEn: 'Pork' },
    { code: 'ALG-009', name: '복숭아',        nameEn: 'Peach' },
    { code: 'ALG-010', name: '토마토',        nameEn: 'Tomato' },
    { code: 'ALG-011', name: '호두',          nameEn: 'Walnut' },
    { code: 'ALG-012', name: '닭고기',        nameEn: 'Chicken' },
    { code: 'ALG-013', name: '쇠고기',        nameEn: 'Beef' },
    { code: 'ALG-014', name: '오징어',        nameEn: 'Squid' },
    { code: 'ALG-015', name: '조개류',        nameEn: 'Shellfish' },
  ];
  for (const a of allergenDefs) {
    await prisma.allergenCode.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }
  console.log(`✅ 알레르기 코드 ${allergenDefs.length}개`);

  // ── 배합비 (Recipe) + 원료 상세 ────────────────────────────────────────
  // 배합비는 seed-kwangsung에서 만든 제품·원료 참조
  const allProductsFull = await prisma.product.findMany();
  const allMaterialsFull = await prisma.material.findMany();
  const prodMapFull = Object.fromEntries(allProductsFull.map(p => [p.code, p]));
  const matMapFull = Object.fromEntries(allMaterialsFull.map(m => [m.code, m]));

  const recipeDefs = [
    {
      prodCode: 'SRC-001', version: '1.0', batchSizeKg: 500, status: 'approved',
      ingredients: [
        { matCode: 'RM-001', ratio: 30, amountKg: 150 },  // 고추가루
        { matCode: 'RM-002', ratio: 8,  amountKg: 40 },   // 정제염
        { matCode: 'RM-003', ratio: 12, amountKg: 60 },   // 설탕
        { matCode: 'RM-010', ratio: 25, amountKg: 125 },  // 물엿
        { matCode: 'RM-013', ratio: 5,  amountKg: 25 },   // 고추씨
        { matCode: 'RM-009', ratio: 10, amountKg: 50 },   // 전분
      ],
    },
    {
      prodCode: 'SAU-001', version: '1.0', batchSizeKg: 1000, status: 'approved',
      ingredients: [
        { matCode: 'RM-004', ratio: 25, amountKg: 250 },  // 간장
        { matCode: 'RM-003', ratio: 15, amountKg: 150 },  // 설탕
        { matCode: 'RM-005', ratio: 8,  amountKg: 80 },   // 마늘
        { matCode: 'RM-006', ratio: 3,  amountKg: 30 },   // 생강
        { matCode: 'RM-007', ratio: 5,  amountKg: 50 },   // 참기름
        { matCode: 'RM-014', ratio: 4,  amountKg: 40 },   // 양파분말
        { matCode: 'RM-011', ratio: 3,  amountKg: 30 },   // 참깨
      ],
    },
    {
      prodCode: 'SRC-002', version: '1.0', batchSizeKg: 500, status: 'approved',
      ingredients: [
        { matCode: 'RM-012', ratio: 50, amountKg: 250 },  // 된장 원액
        { matCode: 'RM-002', ratio: 10, amountKg: 50 },   // 정제염
        { matCode: 'RM-005', ratio: 8,  amountKg: 40 },   // 마늘
        { matCode: 'RM-001', ratio: 5,  amountKg: 25 },   // 고추가루
      ],
    },
    {
      prodCode: 'SRC-003', version: '2.0', batchSizeKg: 2000, status: 'approved',
      ingredients: [
        { matCode: 'RM-004', ratio: 60, amountKg: 1200 },  // 간장 원액
        { matCode: 'RM-002', ratio: 15, amountKg: 300 },   // 정제염
        { matCode: 'RM-003', ratio: 10, amountKg: 200 },   // 설탕
      ],
    },
    {
      prodCode: 'RTE-001', version: '1.0', batchSizeKg: 200, status: 'approved',
      ingredients: [
        { matCode: 'RM-012', ratio: 15, amountKg: 30 },   // 된장
        { matCode: 'RM-005', ratio: 8,  amountKg: 16 },   // 마늘
        { matCode: 'RM-001', ratio: 5,  amountKg: 10 },   // 고추가루
        { matCode: 'RM-002', ratio: 3,  amountKg: 6 },    // 정제염
      ],
    },
    {
      prodCode: 'DRS-001', version: '1.0', batchSizeKg: 300, status: 'approved',
      ingredients: [
        { matCode: 'RM-007', ratio: 20, amountKg: 60 },   // 참기름
        { matCode: 'RM-011', ratio: 15, amountKg: 45 },   // 참깨
        { matCode: 'RM-008', ratio: 30, amountKg: 90 },   // 식용유
        { matCode: 'RM-003', ratio: 10, amountKg: 30 },   // 설탕
      ],
    },
  ];

  for (const rd of recipeDefs) {
    const product = prodMapFull[rd.prodCode];
    if (!product) continue;

    const existing = await prisma.recipe.findFirst({
      where: { productId: product.id, version: rd.version },
    });

    let recipeId;
    if (!existing) {
      const recipe = await prisma.recipe.create({
        data: {
          productId: product.id,
          version: rd.version,
          batchSizeKg: rd.batchSizeKg,
          status: rd.status,
          approvedById: rd.status === 'approved' ? manager.id : null,
          approvedAt: rd.status === 'approved' ? d('2026-02-01 10:00') : null,
          createdById: manager.id,
        },
      });
      recipeId = recipe.id;
    } else {
      recipeId = existing.id;
    }

    // 원료 상세
    for (let si = 0; si < rd.ingredients.length; si++) {
      const ing = rd.ingredients[si];
      const material = matMapFull[ing.matCode];
      if (!material) continue;
      const existsIng = await prisma.recipeIngredient.findFirst({
        where: { recipeId, materialId: material.id },
      });
      if (!existsIng) {
        await prisma.recipeIngredient.create({
          data: {
            recipeId,
            materialId: material.id,
            ratio: ing.ratio,
            amountKg: ing.amountKg,
            sortOrder: si + 1,
          },
        });
      }
    }
  }
  console.log(`✅ 배합비(Recipe) ${recipeDefs.length}개 + 원료상세`);

  // ── HACCP 계획 ──────────────────────────────────────────────────────────
  const haccpDefs = [
    {
      ccpNo: 'CCP-1', hazardType: 'biological', processCode: 'P-SAU001-030',
      hazardDesc: '살균 공정 온도 미달 시 병원성 미생물(살모넬라, 대장균) 잔존 위험',
      criticalLimit: '85℃ 이상 / 30분 이상',
      monitoringFreq: '매 배치 살균 시작·종료 시점 온도 기록',
      correctiveAction: '온도 미달 시 재살균 후 미생물 검사 실시',
      verifyMethod: '온도기록지 일일 확인 / 월 1회 미생물 검사',
      status: 'active',
    },
    {
      ccpNo: 'CCP-2', hazardType: 'physical', processCode: 'P-SAU001-060',
      hazardDesc: '금속 이물 혼입 (장비 파손, 원료 혼입)',
      criticalLimit: 'Fe 1.5mm / SUS 2.0mm 이하',
      monitoringFreq: '전 제품 금속검출기 통과 (연속)',
      correctiveAction: '검출 시 해당 LOT 격리 후 전수 재검사',
      verifyMethod: '1시간마다 테스트피스 통과 확인',
      status: 'active',
    },
    {
      ccpNo: 'CCP-3', hazardType: 'biological', processCode: 'P-RTE001-040',
      hazardDesc: '레토르트 살균 부족 시 내열성 아포 잔존 (보툴리눔균 등)',
      criticalLimit: '121℃ / 40분 이상 (F0 ≥ 4.0)',
      monitoringFreq: '매 배치 온도·시간·압력 자동 기록',
      correctiveAction: '조건 미달 시 재살균 또는 폐기',
      verifyMethod: 'F0 값 자동계산 확인 / 월 1회 무균시험',
      status: 'active',
    },
    {
      ccpNo: 'CCP-4', hazardType: 'chemical', processCode: 'P-SRC001-020',
      hazardDesc: '알레르기 유발물질 교차 오염 (밀, 대두, 우유)',
      criticalLimit: '제조라인 교차오염 기준 10ppm 이하',
      monitoringFreq: '품목 변경 시 CIP 세척 완료 확인',
      correctiveAction: '세척 부적합 시 재세척 후 스왑 테스트',
      verifyMethod: '스왑 테스트 기록 확인 / 분기 1회 정밀 분석',
      status: 'active',
    },
    {
      ccpNo: 'CCP-5', hazardType: 'biological', processCode: 'P-SRC003-030',
      hazardDesc: '간장 UHT 살균 불충분으로 인한 미생물 오염',
      criticalLimit: '135℃ / 2초 이상 (UHT)',
      monitoringFreq: '연속 온도 모니터링 (자동기록)',
      correctiveAction: '온도 이탈 시 자동 라인 정지 및 재살균',
      verifyMethod: '월 1회 무균시험 / 일 1회 기록 확인',
      status: 'active',
    },
  ];

  const haccpMap = {};
  for (const hp of haccpDefs) {
    const existing = await prisma.haccpPlan.findUnique({ where: { ccpNo: hp.ccpNo } });
    if (!existing) {
      const created = await prisma.haccpPlan.create({
        data: {
          ccpNo: hp.ccpNo,
          hazardType: hp.hazardType,
          processCode: hp.processCode,
          hazardDesc: hp.hazardDesc,
          criticalLimit: hp.criticalLimit,
          monitoringFreq: hp.monitoringFreq,
          correctiveAction: hp.correctiveAction,
          verifyMethod: hp.verifyMethod,
          status: hp.status,
          effectiveDate: d('2026-01-01'),
          createdById: manager.id,
        },
      });
      haccpMap[hp.ccpNo] = created;
    } else {
      haccpMap[hp.ccpNo] = existing;
    }
  }
  console.log(`✅ HACCP 계획 ${haccpDefs.length}개`);

  // ── CCP 모니터링 기록 ──────────────────────────────────────────────────
  const ccpMonDefs = [
    { ccpNo: 'CCP-1', measuredValue: '87.2℃ / 32min', result: 'pass', monitoredAt: d('2026-02-10 10:30'), lotNo: 'LOT-SAU001-2602101' },
    { ccpNo: 'CCP-1', measuredValue: '86.8℃ / 31min', result: 'pass', monitoredAt: d('2026-02-11 10:25'), lotNo: 'LOT-SAU001-2602111' },
    { ccpNo: 'CCP-1', measuredValue: '83.5℃ / 28min', result: 'fail', monitoredAt: d('2026-02-12 10:40'), lotNo: 'LOT-SAU001-2602121', deviationNote: '온도 미달 — 재살균 처리 후 합격' },
    { ccpNo: 'CCP-1', measuredValue: '88.1℃ / 35min', result: 'pass', monitoredAt: d('2026-02-13 10:20'), lotNo: 'LOT-SAU001-2602131' },
    { ccpNo: 'CCP-2', measuredValue: 'Fe 0.8mm 검출 없음', result: 'pass', monitoredAt: d('2026-02-10 14:00'), lotNo: 'LOT-SAU001-2602101' },
    { ccpNo: 'CCP-2', measuredValue: 'Fe 0.8mm 검출 없음', result: 'pass', monitoredAt: d('2026-02-11 14:10'), lotNo: 'LOT-SAU001-2602111' },
    { ccpNo: 'CCP-2', measuredValue: 'SUS 1.2mm 검출', result: 'fail', monitoredAt: d('2026-02-14 14:30'), lotNo: 'LOT-SAU001-2602141', deviationNote: '해당 LOT 격리 후 전수 재검사 — 이물 제거 확인' },
    { ccpNo: 'CCP-3', measuredValue: '121.5℃ / 42min / F0=4.8', result: 'pass', monitoredAt: d('2026-02-15 11:00'), lotNo: 'LOT-RTE001-2602151' },
    { ccpNo: 'CCP-3', measuredValue: '121.2℃ / 41min / F0=4.5', result: 'pass', monitoredAt: d('2026-02-16 11:10'), lotNo: 'LOT-RTE001-2602161' },
    { ccpNo: 'CCP-4', measuredValue: '스왑 테스트 < 5ppm', result: 'pass', monitoredAt: d('2026-02-10 07:00'), lotNo: null },
    { ccpNo: 'CCP-4', measuredValue: '스왑 테스트 < 5ppm', result: 'pass', monitoredAt: d('2026-02-17 07:00'), lotNo: null },
    { ccpNo: 'CCP-5', measuredValue: '136.2℃ / 2.1초', result: 'pass', monitoredAt: d('2026-02-18 09:30'), lotNo: 'LOT-SRC003-2602181' },
  ];

  for (const cm of ccpMonDefs) {
    const plan = haccpMap[cm.ccpNo];
    if (!plan) continue;
    const exists = await prisma.ccpMonitoring.findFirst({
      where: { haccpPlanId: plan.id, monitoredAt: cm.monitoredAt },
    });
    if (!exists) {
      await prisma.ccpMonitoring.create({
        data: {
          haccpPlanId: plan.id,
          measuredValue: cm.measuredValue,
          result: cm.result,
          monitoredAt: cm.monitoredAt,
          lotNo: cm.lotNo,
          deviationNote: cm.deviationNote ?? null,
          operatorId: operator1.id,
        },
      });
    }
  }
  console.log(`✅ CCP 모니터링 ${ccpMonDefs.length}개`);

  // ── 위생점검 기록 ──────────────────────────────────────────────────────
  const hygieneDefs = [
    { checkDate: d('2026-02-03'), shift: '1st', area: 'production', result: 'pass',
      items: JSON.stringify({ '바닥청결': 'pass', '벽면상태': 'pass', '배수구위생': 'pass', '작업대청결': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-03'), shift: '1st', area: 'equipment', result: 'pass',
      items: JSON.stringify({ '배합기세척': 'pass', '살균기점검': 'pass', '충전기위생': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-03'), shift: '1st', area: 'personnel', result: 'pass',
      items: JSON.stringify({ '위생복착용': 'pass', '손세척확인': 'pass', '건강상태': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-10'), shift: '1st', area: 'production', result: 'conditional_pass',
      items: JSON.stringify({ '바닥청결': 'pass', '벽면상태': 'pass', '배수구위생': 'fail', '작업대청결': 'pass' }),
      failItems: '배수구위생', correctiveAction: '배수구 트랩 세척 및 소독 완료' },
    { checkDate: d('2026-02-10'), shift: '1st', area: 'storage', result: 'pass',
      items: JSON.stringify({ '냉장온도': 'pass', '냉동온도': 'pass', '정리정돈': 'pass', '유통기한관리': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-10'), shift: '1st', area: 'equipment', result: 'pass',
      items: JSON.stringify({ '배합기세척': 'pass', '살균기점검': 'pass', '충전기위생': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-17'), shift: '1st', area: 'production', result: 'pass',
      items: JSON.stringify({ '바닥청결': 'pass', '벽면상태': 'pass', '배수구위생': 'pass', '작업대청결': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-17'), shift: '1st', area: 'restroom', result: 'pass',
      items: JSON.stringify({ '변기위생': 'pass', '세면대': 'pass', '손소독제비치': 'pass' }),
      failItems: null, correctiveAction: null },
    { checkDate: d('2026-02-17'), shift: '2nd', area: 'production', result: 'fail',
      items: JSON.stringify({ '바닥청결': 'fail', '벽면상태': 'pass', '배수구위생': 'pass', '작업대청결': 'fail' }),
      failItems: '바닥청결, 작업대청결', correctiveAction: '2교대 교대 시 청소 강화 지시 — 당일 재점검 합격' },
    { checkDate: d('2026-02-20'), shift: '1st', area: 'production', result: 'pass',
      items: JSON.stringify({ '바닥청결': 'pass', '벽면상태': 'pass', '배수구위생': 'pass', '작업대청결': 'pass' }),
      failItems: null, correctiveAction: null },
  ];

  for (const hg of hygieneDefs) {
    const exists = await prisma.hygieneCheck.findFirst({
      where: { checkDate: hg.checkDate, shift: hg.shift, area: hg.area },
    });
    if (!exists) {
      await prisma.hygieneCheck.create({
        data: {
          checkDate: hg.checkDate,
          shift: hg.shift,
          area: hg.area,
          checkedById: qc1.id,
          items: hg.items,
          result: hg.result,
          failItems: hg.failItems,
          correctiveAction: hg.correctiveAction,
        },
      });
    }
  }
  console.log(`✅ 위생점검 ${hygieneDefs.length}개`);

  // ── 이물검출 관리 ──────────────────────────────────────────────────────
  const foreignDefs = [
    {
      reportNo: 'FB-20260214-001', detectedAt: d('2026-02-14 14:30'),
      lotNo: 'LOT-SAU001-2602141', prodCode: 'SAU-001',
      detectionPoint: '금속검출기 #1 (MTL-001)',
      foreignType: 'metal', size: '1.2mm', disposition: 'rework',
      rootCause: '배합기 교반 날개 마모 조각',
      correctiveAction: '교반 날개 교체 및 배합기 전수 점검 — 해당 LOT 재검사 후 출하',
      affectedQty: 120, status: 'closed',
    },
    {
      reportNo: 'FB-20260218-001', detectedAt: d('2026-02-18 11:00'),
      lotNo: 'LOT-SRC003-2602181', prodCode: 'SRC-003',
      detectionPoint: 'X-RAY 이물검출기 (XRY-001)',
      foreignType: 'glass', size: '0.8mm', disposition: 'scrap',
      rootCause: '유리병 파손 조각 혼입 (충전 공정)',
      correctiveAction: '유리병 입고 검사 강화 — 해당 LOT 전량 폐기',
      affectedQty: 50, status: 'closed',
    },
    {
      reportNo: 'FB-20260220-001', detectedAt: d('2026-02-20 09:15'),
      lotNo: 'LOT-RTE001-2602201', prodCode: 'RTE-001',
      detectionPoint: '육안검사 (포장 전)',
      foreignType: 'plastic', size: '3mm', disposition: 'rework',
      rootCause: '포장재 절단 부스러기',
      correctiveAction: '포장기 절단 칼날 점검 — 절단 부스러기 방지 가이드 설치',
      affectedQty: 30, status: 'open',
    },
  ];

  for (const fb of foreignDefs) {
    const prod = prodMapFull[fb.prodCode];
    await prisma.foreignBodyReport.upsert({
      where: { reportNo: fb.reportNo },
      update: {},
      create: {
        reportNo: fb.reportNo,
        detectedAt: fb.detectedAt,
        lotNo: fb.lotNo,
        productId: prod?.id ?? null,
        detectionPoint: fb.detectionPoint,
        foreignType: fb.foreignType,
        size: fb.size,
        disposition: fb.disposition,
        rootCause: fb.rootCause,
        correctiveAction: fb.correctiveAction,
        affectedQty: fb.affectedQty,
        reportedById: qc1.id,
        status: fb.status,
      },
    });
  }
  console.log(`✅ 이물검출 ${foreignDefs.length}개`);

  console.log('\n🎉 전 메뉴 기본 데이터 입력 완료!');
  console.log('   고객사 +5 / 원자재 +3 / 공통코드 10 / 인터페이스 10');
  console.log('   수주 10 / 작업지시 10 / 생산로그 10 / 불량로그 10');
  console.log('   검사기록 10 / NCR 10 / SPC 10 / 출하 10');
  console.log('   재고 17 / 입출고이력 10 / 유지보수 10 / 설비로그 10 / LOT 10');
  console.log('   --- 식품 전용 ---');
  console.log(`   알레르기코드 ${allergenDefs.length} / 배합비 ${recipeDefs.length}`);
  console.log(`   HACCP ${haccpDefs.length} / CCP모니터링 ${ccpMonDefs.length}`);
  console.log(`   위생점검 ${hygieneDefs.length} / 이물검출 ${foreignDefs.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
