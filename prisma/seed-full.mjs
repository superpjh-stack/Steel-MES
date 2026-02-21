/**
 * seed-full.mjs — 광성정밀 전 메뉴 기본 데이터 (메뉴별 10건)
 * 실행: node prisma/seed-full.mjs
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 날짜 헬퍼 ──────────────────────────────────────────────────────────────
const d = (s) => new Date(s);
const today = '2026-02-21';

async function main() {
  console.log('🌱 광성정밀 전 메뉴 기본 데이터 입력 시작...\n');

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

  console.log('\n🎉 전 메뉴 기본 데이터 입력 완료!');
  console.log('   고객사 +5 / 원자재 +3 / 공통코드 10 / 인터페이스 10');
  console.log('   수주 10 / 작업지시 10 / 생산로그 10 / 불량로그 10');
  console.log('   검사기록 10 / NCR 10 / SPC 10 / 출하 10');
  console.log('   재고 17 / 입출고이력 10 / 유지보수 10 / 설비로그 10 / LOT 10');
}

main().catch(console.error).finally(() => prisma.$disconnect());
