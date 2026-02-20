import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 관리자 계정
  await prisma.user.upsert({
    where: { email: 'admin@mes.local' },
    update: {},
    create: {
      email: 'admin@mes.local',
      name: '시스템관리자',
      passwordHash: await bcrypt.hash('admin1234!', 12),
      role: 'admin',
      department: '시스템',
    },
  });

  // 매니저 (관리자 역할)
  await prisma.user.upsert({
    where: { email: 'manager1@mes.local' },
    update: {},
    create: {
      email: 'manager1@mes.local',
      name: '박관리자',
      passwordHash: await bcrypt.hash('mgr1234!', 12),
      role: 'manager',
      department: '생산관리팀',
    },
  });

  // 테스트 작업자
  await prisma.user.upsert({
    where: { email: 'operator1@mes.local' },
    update: {},
    create: {
      email: 'operator1@mes.local',
      name: '김작업자',
      passwordHash: await bcrypt.hash('oper1234!', 12),
      role: 'operator',
      department: '생산1팀',
      shift: '1st',
    },
  });

  // 품질담당
  await prisma.user.upsert({
    where: { email: 'qc1@mes.local' },
    update: {},
    create: {
      email: 'qc1@mes.local',
      name: '이품질',
      passwordHash: await bcrypt.hash('qc1234!', 12),
      role: 'qc',
      department: '품질팀',
    },
  });

  // 고객사
  const customer = await prisma.customer.upsert({
    where: { code: 'HMC' },
    update: {},
    create: { code: 'HMC', name: '현대자동차', contact: '구매팀', otdTarget: 98 },
  });

  // 품목
  const product = await prisma.product.upsert({
    where: { code: 'BRK-001' },
    update: {},
    create: {
      code: 'BRK-001',
      name: '브레이크 캘리퍼 LH',
      category: 'brake',
      unit: 'EA',
      customerId: customer.id,
      drawingNo: 'DWG-BRK-001-A',
      stdCycleSec: 45,
    },
  });

  // 설비
  const equipment = await prisma.equipment.upsert({
    where: { code: 'EQ-PRE-001' },
    update: {},
    create: {
      code: 'EQ-PRE-001',
      name: '300T 프레스 #1',
      type: 'press',
      location: 'A라인-1번',
      pmCycleDays: 30,
      lastPmDate: new Date('2026-02-01'),
      status: 'running',
    },
  });

  // 공정
  await prisma.process.upsert({
    where: { code: 'P010' },
    update: {},
    create: {
      code: 'P010', name: '프레스 성형', seq: 1,
      productId: product.id, equipmentId: equipment.id,
    },
  });
  await prisma.process.upsert({
    where: { code: 'P020' },
    update: {},
    create: { code: 'P020', name: '열처리', seq: 2, productId: product.id },
  });
  await prisma.process.upsert({
    where: { code: 'P030' },
    update: {},
    create: { code: 'P030', name: 'CNC 가공', seq: 3, productId: product.id },
  });
  await prisma.process.upsert({
    where: { code: 'P040' },
    update: {},
    create: { code: 'P040', name: '조립', seq: 4, productId: product.id },
  });
  await prisma.process.upsert({
    where: { code: 'P050' },
    update: {},
    create: { code: 'P050', name: '출하검사', seq: 5, productId: product.id },
  });

  console.log('✅ Seed 완료');
}

main().catch(console.error).finally(() => prisma.$disconnect());
