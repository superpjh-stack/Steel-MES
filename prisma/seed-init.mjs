/**
 * seed-init.mjs — 초기 사용자 계정 생성 (Cloud Run 최초 기동 시 사용)
 * node prisma/seed-init.mjs
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 이미 사용자가 존재하면 스킵
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`Seed skipped: ${count} user(s) already exist.`);
    return;
  }

  console.log('Seeding initial users...');

  const users = [
    { email: 'admin@mes.local',    name: '시스템관리자', pw: 'admin1234!', role: 'admin',    dept: '시스템',      shift: null },
    { email: 'manager1@mes.local', name: '박관리자',    pw: 'mgr1234!',   role: 'manager',  dept: '생산관리팀',  shift: null },
    { email: 'operator1@mes.local',name: '김작업자',    pw: 'oper1234!',  role: 'operator', dept: '생산1팀',     shift: '1st' },
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        email:        u.email,
        name:         u.name,
        passwordHash: await bcrypt.hash(u.pw, 12),
        role:         u.role,
        department:   u.dept,
        shift:        u.shift,
      },
    });
    console.log(`  Created: ${u.email} (${u.role})`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
