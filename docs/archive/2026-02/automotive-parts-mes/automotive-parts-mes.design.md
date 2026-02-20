# Design: 자동차부품제조 전문 MES

## 메타 정보

| 항목 | 내용 |
|------|------|
| 기능명 | automotive-parts-mes |
| 참조 Plan | `docs/01-plan/features/automotive-parts-mes.plan.md` |
| 작성일 | 2026-02-20 |
| 레벨 | Dynamic |
| 기술스택 | Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL · NextAuth.js |

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  PC Browser (관리자/QC/감독자)  │  Touch Panel (작업자)  │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS / SSE (사내 LAN)
┌───────────────▼─────────────────────────────────────────┐
│              Next.js App (App Router)                   │
│  /app/(dashboard)   /app/(operator)   /app/api/...      │
│  NextAuth.js 세션 관리 · RBAC 미들웨어                   │
└───────────────┬─────────────────────────────────────────┘
                │ Prisma Client
┌───────────────▼─────────────────────────────────────────┐
│               PostgreSQL 16 (온프레미스)                  │
│   사내 서버 또는 Docker Container                         │
│   파일 저장: 로컬 FS / MinIO (S3 호환)                   │
└─────────────────────────────────────────────────────────┘
```

### 레이아웃 분리
- `/app/(dashboard)/` — 관리자·QC·감독자용 (사이드바 + 헤더)
- `/app/(operator)/` — 현장 작업자용 (터치 최적화, 풀스크린)
- `/app/api/` — Next.js API Routes (비즈니스 로직 + Prisma 쿼리)
- `src/auth.ts` — NextAuth.js 설정 (Credentials + JWT)

---

## 2. DB 스키마 (Prisma Schema → PostgreSQL)

### 2.1 마스터 테이블

#### `products` — 품목 마스터
```sql
id            UUID  PK
code          TEXT  UNIQUE  -- 품목코드 (ex: BRK-001)
name          TEXT          -- 품목명 (브레이크 캘리퍼 LH)
category      TEXT          -- 'brake' | 'handle' | 'other'
unit          TEXT          -- 'EA' | 'KG' | 'SET'
customer_id   UUID  FK→customers
drawing_no    TEXT          -- 도면번호
std_cycle_sec INT           -- 표준 사이클타임(초)
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

#### `processes` — 공정 마스터
```sql
id            UUID  PK
code          TEXT  UNIQUE  -- 공정코드 (ex: P010)
name          TEXT          -- 단조 / 열처리 / CNC가공 / 조립 / 검사
seq           INT           -- 공정 순서
product_id    UUID  FK→products  -- NULL이면 공용 공정
equipment_id  UUID  FK→equipment
created_at    TIMESTAMPTZ
```

#### `equipment` — 설비 마스터
```sql
id            UUID  PK
code          TEXT  UNIQUE  -- 설비코드 (ex: EQ-PRE-001)
name          TEXT          -- 300T 프레스 #1
type          TEXT          -- 'press' | 'forging' | 'cnc' | 'assembly' | 'inspection'
location      TEXT          -- 라인/공장 위치
manufacturer  TEXT
install_date  DATE
pm_cycle_days INT           -- 예방보전 주기(일)
last_pm_date  DATE
status        TEXT          -- 'running' | 'stopped' | 'maintenance' | 'breakdown'
created_at    TIMESTAMPTZ
updated_at    TIMESTAMPTZ
```

#### `customers` — 고객사 마스터
```sql
id            UUID  PK
code          TEXT  UNIQUE  -- 고객사코드
name          TEXT          -- 현대자동차 / 기아 / GM Korea
contact       TEXT
otd_target    NUMERIC(5,2)  -- 납기 목표율 (%)
created_at    TIMESTAMPTZ
```

#### `materials` — 자재 마스터
```sql
id            UUID  PK
code          TEXT  UNIQUE
name          TEXT          -- SCM415 (크롬몰리브덴강)
unit          TEXT
spec          TEXT          -- 재질 규격
supplier      TEXT
safety_stock  NUMERIC       -- 안전재고량
created_at    TIMESTAMPTZ
```

---

### 2.2 생산 테이블

#### `work_orders` — 작업지시
```sql
id              UUID  PK
wo_no           TEXT  UNIQUE  -- WO-20260220-001
product_id      UUID  FK→products
customer_id     UUID  FK→customers
planned_qty     INT
produced_qty    INT  DEFAULT 0
defect_qty      INT  DEFAULT 0
status          TEXT  -- 'draft'|'issued'|'in_progress'|'completed'|'cancelled'
planned_start   TIMESTAMPTZ
planned_end     TIMESTAMPTZ
actual_start    TIMESTAMPTZ
actual_end      TIMESTAMPTZ
due_date        DATE
priority        INT  DEFAULT 5  -- 1(긴급)~10(보통)
notes           TEXT
created_by      UUID  FK→users
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### `production_logs` — 생산 실적
```sql
id              UUID  PK
work_order_id   UUID  FK→work_orders
process_id      UUID  FK→processes
equipment_id    UUID  FK→equipment
operator_id     UUID  FK→users
lot_no          TEXT          -- 로트번호
planned_qty     INT
good_qty        INT
defect_qty      INT
scrap_qty       INT
start_time      TIMESTAMPTZ
end_time        TIMESTAMPTZ
cycle_time_sec  INT           -- 실제 사이클타임
notes           TEXT
created_at      TIMESTAMPTZ
```

#### `lot_traceability` — 로트 추적
```sql
id              UUID  PK
lot_no          TEXT  UNIQUE
material_id     UUID  FK→materials
material_lot    TEXT          -- 원자재 로트번호
work_order_id   UUID  FK→work_orders
product_id      UUID  FK→products
qty             NUMERIC
status          TEXT  -- 'wip'|'finished'|'shipped'|'scrapped'
created_at      TIMESTAMPTZ
```

---

### 2.3 품질 테이블

#### `inspection_records` — 검사 기록
```sql
id              UUID  PK
type            TEXT  -- 'incoming'|'in_process'|'outgoing'
work_order_id   UUID  FK→work_orders
lot_no          TEXT
process_id      UUID  FK→processes
inspector_id    UUID  FK→users
sample_qty      INT
pass_qty        INT
fail_qty        INT
result          TEXT  -- 'pass'|'fail'|'conditional'
inspection_date TIMESTAMPTZ
notes           TEXT
created_at      TIMESTAMPTZ
```

#### `defect_logs` — 불량 기록
```sql
id              UUID  PK
production_log_id UUID FK→production_logs
inspection_id   UUID  FK→inspection_records
defect_code     TEXT          -- 치수불량/외관불량/재료불량/기능불량
defect_name     TEXT
qty             INT
disposition     TEXT  -- 'rework'|'scrap'|'use_as_is'|'return'
root_cause      TEXT
corrective_action TEXT
created_by      UUID  FK→users
created_at      TIMESTAMPTZ
```

#### `spc_measurements` — SPC 측정값
```sql
id              UUID  PK
work_order_id   UUID  FK→work_orders
process_id      UUID  FK→processes
characteristic  TEXT          -- 측정 특성 (외경/내경/두께 등)
usl             NUMERIC       -- 상한 규격
lsl             NUMERIC       -- 하한 규격
nominal         NUMERIC       -- 기준값
measured_value  NUMERIC
measured_at     TIMESTAMPTZ
operator_id     UUID  FK→users
equipment_id    UUID  FK→equipment
subgroup_no     INT           -- X-bar 관리도 소그룹 번호
```

#### `nonconformance_reports` — 부적합품 보고서 (NCR)
```sql
id              UUID  PK
ncr_no          TEXT  UNIQUE
defect_log_id   UUID  FK→defect_logs
disposition     TEXT
approver_id     UUID  FK→users
approved_at     TIMESTAMPTZ
status          TEXT  -- 'open'|'under_review'|'approved'|'closed'
created_at      TIMESTAMPTZ
```

---

### 2.4 설비관리 테이블

#### `equipment_logs` — 설비 가동 기록 (OEE 계산 기반)
```sql
id              UUID  PK
equipment_id    UUID  FK→equipment
log_date        DATE
shift           TEXT  -- '1st'|'2nd'|'3rd'
planned_time_min INT            -- 계획 가동시간
actual_time_min  INT            -- 실제 가동시간
breakdown_min    INT  DEFAULT 0 -- 고장 정지시간
setup_min        INT  DEFAULT 0 -- 교체/셋업 시간
planned_qty      INT
actual_qty       INT
good_qty         INT
-- OEE 계산:
--   가용률 = (계획-정지)/계획
--   성능률 = (실적수량×사이클타임)/실가동시간
--   품질률 = 양품/실적수량
created_at       TIMESTAMPTZ
```

#### `maintenance_records` — 보전 이력
```sql
id              UUID  PK
equipment_id    UUID  FK→equipment
type            TEXT  -- 'preventive'|'corrective'|'emergency'
description     TEXT
technician_id   UUID  FK→users
start_time      TIMESTAMPTZ
end_time        TIMESTAMPTZ
parts_used      JSONB         -- [{part_name, qty, cost}]
cost            NUMERIC
next_pm_date    DATE
created_at      TIMESTAMPTZ
```

---

### 2.5 자재·재고 테이블

#### `inventory` — 재고
```sql
id              UUID  PK
material_id     UUID  FK→materials  -- NULL이면 제품 재고
product_id      UUID  FK→products   -- NULL이면 자재 재고
lot_no          TEXT
qty             NUMERIC
location        TEXT              -- 창고/위치 코드
status          TEXT  -- 'available'|'reserved'|'quarantine'
updated_at      TIMESTAMPTZ
```

#### `inventory_movements` — 재고 이동 이력
```sql
id              UUID  PK
inventory_id    UUID  FK→inventory
movement_type   TEXT  -- 'receipt'|'issue'|'return'|'adjustment'|'shipment'
qty             NUMERIC  -- +입고 / -출고
work_order_id   UUID  FK→work_orders
reference_no    TEXT
created_by      UUID  FK→users
created_at      TIMESTAMPTZ
```

---

### 2.6 출하 테이블

#### `shipments` — 출하
```sql
id              UUID  PK
shipment_no     TEXT  UNIQUE
customer_id     UUID  FK→customers
work_order_id   UUID  FK→work_orders
product_id      UUID  FK→products
lot_no          TEXT
shipped_qty     INT
planned_date    DATE
actual_date     DATE
status          TEXT  -- 'planned'|'packed'|'shipped'|'delivered'
created_by      UUID  FK→users
created_at      TIMESTAMPTZ
```

---

### 2.7 사용자 테이블 (NextAuth.js 관리)

#### `users` (NextAuth.js Credentials + Prisma)
```sql
id              UUID  PK  DEFAULT gen_random_uuid()
email           TEXT  UNIQUE  NOT NULL
name            TEXT  NOT NULL
password_hash   TEXT  NOT NULL   -- bcrypt 해시
role            TEXT  NOT NULL   -- 'operator'|'qc'|'me'|'supervisor'|'manager'|'admin'
department      TEXT
shift           TEXT  -- '1st'|'2nd'|'3rd'|'day'
is_active       BOOLEAN  DEFAULT true
last_login_at   TIMESTAMPTZ
created_at      TIMESTAMPTZ  DEFAULT now()
updated_at      TIMESTAMPTZ  DEFAULT now()
```

> Prisma Schema 예시:
> ```prisma
> model User {
>   id           String   @id @default(uuid())
>   email        String   @unique
>   name         String
>   passwordHash String   @map("password_hash")
>   role         UserRole
>   department   String?
>   shift        String?
>   isActive     Boolean  @default(true) @map("is_active")
>   createdAt    DateTime @default(now()) @map("created_at")
>   updatedAt    DateTime @updatedAt @map("updated_at")
>   @@map("users")
> }
> enum UserRole { operator qc me supervisor manager admin }
> ```

---

## 3. API 설계 (Next.js API Routes)

### 3.1 인증 (NextAuth.js)
```
POST   /api/auth/[...nextauth]  -- NextAuth.js 핸들러 (로그인/로그아웃/세션)
GET    /api/auth/session        -- 현재 세션 조회
```
> - `src/auth.ts` — Credentials Provider, bcrypt 검증, JWT 세션
> - `src/middleware.ts` — 역할별 라우트 보호 (withAuth)

### 3.2 마스터 관리
```
GET    /api/products            -- 품목 목록 (검색/페이징)
POST   /api/products            -- 품목 등록
PUT    /api/products/[id]       -- 품목 수정
GET    /api/processes           -- 공정 목록
POST   /api/processes
GET    /api/equipment           -- 설비 목록
POST   /api/equipment
GET    /api/customers           -- 고객사 목록
GET    /api/materials           -- 자재 목록
```

### 3.3 생산관리
```
GET    /api/work-orders         -- 작업지시 목록 (상태/기간 필터)
POST   /api/work-orders         -- 작업지시 생성
GET    /api/work-orders/[id]    -- 작업지시 상세
PUT    /api/work-orders/[id]/status  -- 상태 변경 (발행/시작/완료)
POST   /api/production-logs     -- 생산 실적 등록
GET    /api/production-logs     -- 실적 조회
GET    /api/dashboard/production -- 생산 현황 집계
```

### 3.4 품질관리
```
POST   /api/inspections         -- 검사 기록 등록
GET    /api/inspections         -- 검사 목록
POST   /api/defects             -- 불량 등록
GET    /api/defects             -- 불량 이력 조회
POST   /api/spc/measurements    -- SPC 측정값 등록
GET    /api/spc/chart           -- SPC 차트 데이터 (특성/기간)
POST   /api/ncr                 -- 부적합품 보고서
GET    /api/dashboard/quality   -- 품질 KPI 집계
```

### 3.5 설비관리
```
GET    /api/equipment/[id]/oee  -- OEE 데이터 (일/월)
POST   /api/equipment/logs      -- 설비 가동 기록
POST   /api/maintenance         -- 보전 이력 등록
GET    /api/maintenance         -- 보전 이력 조회
GET    /api/equipment/pm-due    -- PM 도래 설비 목록
```

### 3.6 자재·재고
```
GET    /api/inventory           -- 재고 현황
POST   /api/inventory/movements -- 재고 입출고
GET    /api/inventory/alerts    -- 안전재고 미달 목록
GET    /api/lot/[lot_no]/trace  -- 로트 추적 (원자재→완제품)
```

### 3.7 출하
```
GET    /api/shipments           -- 출하 목록
POST   /api/shipments           -- 출하 등록
PUT    /api/shipments/[id]/status
GET    /api/dashboard/delivery  -- 납기 현황 KPI
```

### 3.8 실시간 (SSE)
```
GET    /api/events/production   -- 생산 현황판 실시간 갱신
GET    /api/events/alerts       -- 이상 알림 스트림
```

---

## 4. 화면 구성 (Page Routes)

### 4.1 공통
```
/login                          -- 로그인
/                               -- 대시보드 (역할별 리다이렉트)
```

### 4.2 경영/감독자 대시보드
```
/dashboard                      -- 공장 KPI 전체 요약
  ├── 생산 현황 (금일 목표/실적/달성률)
  ├── 품질 현황 (불량률, 클레임 건수)
  ├── 설비 현황 (OEE, 정지 설비)
  └── 납기 현황 (OTD율, 긴급 건)
```

### 4.3 생산관리
```
/production/work-orders         -- 작업지시 목록/생성
/production/work-orders/[id]    -- 작업지시 상세 + 실적 현황
/production/monitor             -- 공정별 실시간 현황판 (대형 디스플레이용)
/production/reports             -- 일/주/월 생산 실적 리포트
```

### 4.4 현장 작업자 (터치 UI)
```
/operator                       -- 작업자 메인 (내 작업지시 목록)
/operator/[wo_id]/start         -- 작업 시작 (바코드 스캔)
/operator/[wo_id]/input         -- 생산 실적 입력 (수량/불량/시간)
/operator/[wo_id]/sop           -- 작업 표준서 팝업
/operator/defect                -- 불량 신속 보고
```

### 4.5 품질관리
```
/quality/inspections            -- 검사 기록 목록/입력
/quality/defects                -- 불량 이력 조회
/quality/spc                    -- SPC 관리도 (특성 선택)
/quality/ncr                    -- 부적합품 보고서 목록/처리
/quality/reports                -- 품질 리포트
```

### 4.6 설비관리
```
/equipment                      -- 설비 목록 + 상태 현황
/equipment/[id]                 -- 설비 상세 + OEE + 보전 이력
/equipment/maintenance          -- 보전 이력 목록/등록
/equipment/pm-schedule          -- 예방보전 일정표
```

### 4.7 자재·재고
```
/inventory                      -- 재고 현황 (자재/반제품/완제품)
/inventory/movements            -- 입출고 이력
/inventory/lot/[lot_no]         -- 로트 추적 뷰
/inventory/alerts               -- 안전재고 알림
```

### 4.8 출하
```
/shipments                      -- 출하 목록/등록
/shipments/delivery-status      -- 납기 현황 (고객사별)
```

### 4.9 시스템 관리
```
/admin/users                    -- 사용자 관리
/admin/products                 -- 품목 마스터
/admin/processes                -- 공정 마스터
/admin/equipment                -- 설비 마스터
/admin/customers                -- 고객사 마스터
/admin/materials                -- 자재 마스터
/admin/defect-codes             -- 불량 코드 관리
```

---

## 5. 핵심 컴포넌트

### 5.1 공통 컴포넌트
```
components/
├── layout/
│   ├── DashboardLayout.tsx     -- 사이드바 + 헤더 (관리자용)
│   └── OperatorLayout.tsx      -- 풀스크린 터치 (작업자용)
├── ui/                         -- shadcn/ui 기반
│   ├── StatusBadge.tsx         -- 상태 뱃지 (진행중/완료/불량 등)
│   ├── KpiCard.tsx             -- KPI 수치 카드
│   ├── DataTable.tsx           -- 페이징·정렬·필터 테이블
│   └── AlertBanner.tsx         -- 이상 알림 배너
├── charts/
│   ├── SpcChart.tsx            -- X-bar/R 관리도 (Recharts)
│   ├── OeeGauge.tsx            -- OEE 게이지
│   ├── ProductionBar.tsx       -- 생산 목표/실적 바차트
│   └── DefectPareto.tsx        -- 불량 파레토
└── operator/
    ├── WorkOrderCard.tsx        -- 작업지시 카드 (터치용)
    ├── QtyPad.tsx              -- 수량 입력 숫자패드
    └── BarcodeScanner.tsx      -- QR/바코드 스캔
```

### 5.2 페이지별 핵심 컴포넌트
```
app/(dashboard)/dashboard/
├── ProductionSummary.tsx       -- 생산 요약 (SSE 실시간)
├── QualityKpi.tsx              -- 불량률·클레임
├── EquipmentStatus.tsx         -- 설비 상태 그리드
└── DeliveryAlert.tsx           -- 납기 위험 건

app/(operator)/operator/
├── WorkOrderList.tsx           -- 내 작업 목록
├── ProductionInput.tsx         -- 실적 입력 폼
└── SopViewer.tsx               -- 작업표준서 PDF/이미지
```

---

## 6. 상태관리 및 데이터 페칭

- **서버 컴포넌트** (Next.js App Router): 마스터 데이터, 리포트 페이지
- **클라이언트 컴포넌트 + SWR**: 실시간 갱신 필요한 현황판
- **SSE (`/api/events/*`)**: 생산 현황판, 이상 알림 실시간 push
- **React Hook Form + Zod**: 모든 입력 폼 유효성 검사

---

## 7. RBAC 권한 매트릭스

| 기능 | Operator | QC | ME | Supervisor | Manager | Admin |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| 생산 실적 입력 | ✅ | - | - | ✅ | - | ✅ |
| 작업지시 생성/발행 | - | - | - | ✅ | ✅ | ✅ |
| 검사 기록 입력 | - | ✅ | - | - | - | ✅ |
| SPC 조회 | - | ✅ | - | ✅ | ✅ | ✅ |
| 불량 승인 (NCR) | - | ✅ | - | ✅ | ✅ | ✅ |
| 설비 보전 기록 | - | - | ✅ | - | - | ✅ |
| 재고 입출고 | - | - | - | ✅ | ✅ | ✅ |
| 경영 대시보드 | - | - | - | ✅ | ✅ | ✅ |
| 마스터 관리 | - | - | - | - | - | ✅ |
| 사용자 관리 | - | - | - | - | - | ✅ |

---

## 8. Phase 1 MVP 구현 우선순위

```
Week 1-2: 기반 구축
  ✦ Next.js 프로젝트 생성 + bkend.ai 연동
  ✦ 인증 (로그인/로그아웃/RBAC 미들웨어)
  ✦ 레이아웃 (Dashboard / Operator)
  ✦ 마스터 CRUD (품목·공정·설비·고객사)

Week 3-4: 생산관리 핵심
  ✦ 작업지시 생성·발행·상태변경
  ✦ 생산 실적 입력 (작업자 터치 UI)
  ✦ 생산 현황 대시보드 (SSE 실시간)

Week 5-6: 품질·설비 기본
  ✦ 공정검사 / 출하검사 기록
  ✦ 불량 등록 및 NCR 생성
  ✦ 설비 가동 기록 + OEE 계산
  ✦ PM 일정 알림
```

---

## 9. 다음 단계

```
/pdca do automotive-parts-mes   ← 구현 시작 가이드
```

