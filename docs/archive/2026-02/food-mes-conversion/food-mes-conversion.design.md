# [Design] Food MES Conversion — 니즈푸드 MES

> **문서 유형**: As-Built Design (구현 후 역문서화)
> **Feature**: food-mes-conversion
> **Date**: 2026-02-21
> **Level**: Enterprise
> **Plan 참조**: [food-mes-conversion.plan.md](../../01-plan/features/food-mes-conversion.plan.md)
> **Match Rate**: 100% (32/32)

---

## 1. 시스템 개요

### 1.1 전환 목적

자동차/금속 부품 MES → **식품 제조 전문 MES (니즈푸드)**로 전환.
Next.js 14 App Router + Prisma + PostgreSQL 스택 유지, 식품 도메인 레이어 추가.

### 1.2 아키텍처 원칙

- **기존 코어 유지**: WorkOrder, ProductionLog, Inspection 등 범용 MES 모델 보존
- **식품 레이어 추가**: 식품 전용 테이블을 별도 추가 (기존 테이블 파괴 없음)
- **브랜딩 분리**: 색상/아이콘/이름만 변경, 레이아웃 구조 유지
- **점진적 확장**: Phase 1~4 순서로 non-breaking 변경

---

## 2. 브랜딩 설계 (Phase 1)

### 2.1 시각적 정체성

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 시스템명 | Metal-MES / automotive-parts-mes | 니즈푸드 MES |
| 색상 포인트 | blue-600 | **green-600** |
| 로고 아이콘 | (기본) | `Leaf` (lucide-react) |
| 태그라인 | - | "스마트 식품 제조 관리 시스템" |

### 2.2 적용 파일

```
src/app/layout.tsx           — metadata title/description
src/app/login/page.tsx       — 로그인 로고, 색상, 태그라인
src/components/layout/Sidebar.tsx — 상단 로고, active 색상
```

### 2.3 색상 적용 규칙

```css
/* Sidebar 활성 메뉴 */
bg-green-600  text-white

/* 로그인 로고 배경 */
bg-green-600

/* 로그인 태그라인 */
text-green-400
```

---

## 3. 메뉴 구조 설계 (Phase 1)

### 3.1 사이드바 네비게이션 구조

```
대시보드                   /dashboard
기준정보관리               /master
  거래처관리               /master/customers
  품목마스터관리           /master/products
  원료/원자재관리          /master/materials
  배합비(레시피)관리 ★    /master/recipes
  설비마스터관리           /master/equipment
  공정관리                 /master/processes
  알레르기코드관리 ★      /master/allergens
  불량코드관리             /master/defect-codes
영업관리                   /sales
자재관리                   /inventory
  재고현황                 /inventory
  유통기한관리 ★          /inventory/expiry
  원산지관리 ★            /inventory/origin
생산관리                   /production
  작업지시                 /production/orders
  생산실적                 /production/logs
  배치생산관리 ★          /production/batch
품질관리                   /quality
식품안전관리 ★ (NEW 대메뉴)
  HACCP 계획관리 ★        /food-safety/haccp
  CCP 모니터링 ★          /food-safety/ccp
  이물검출관리 ★          /food-safety/foreign
  위생점검관리 ★          /food-safety/hygiene
출하관리                   /shipments
POP 관리                   /pop
모니터링/KPI               /monitoring
설비관리                   /equipment
시스템관리                 /admin
```

★ = 식품 도메인 신규 추가

### 3.2 RBAC 미들웨어 확장

```typescript
// src/middleware.ts
'/food-safety': ['qc', 'supervisor', 'manager', 'admin'],
```

---

## 4. 데이터 모델 설계 (Phase 2)

### 4.1 식품 전용 신규 모델

#### Recipe (배합비/BOM)
```prisma
model Recipe {
  id           String   @id @default(uuid())
  productId    String                          // → Product
  version      String   @default("1.0")
  batchSizeKg  Float                           // 배치 생산량(kg)
  status       String   @default("draft")      // draft|approved|obsolete
  approvedById String?
  approvedAt   DateTime?
  notes        String?
  createdById  String
  createdAt    DateTime @default(now())
  ingredients  RecipeIngredient[]
}

model RecipeIngredient {
  id         String  @id @default(uuid())
  recipeId   String                    // → Recipe
  materialId String                    // → Material
  ratio      Float                     // 배합 비율(%)
  amountKg   Float                     // 배치당 투입량(kg)
  sortOrder  Int     @default(0)
  notes      String?
}
```

#### HaccpPlan (HACCP 계획)
```prisma
model HaccpPlan {
  id               String    @id @default(uuid())
  ccpNo            String    @unique                // CCP-1, CCP-2 ...
  hazardType       String                           // biological|chemical|physical
  hazardDesc       String
  criticalLimit    String                           // 한계기준 (예: "85℃ 이상/30분")
  monitoringFreq   String
  correctiveAction String
  status           String    @default("active")     // active|under_review|suspended
  effectiveDate    DateTime
  monitoringLogs   CcpMonitoring[]
}
```

#### CcpMonitoring (CCP 모니터링 기록)
```prisma
model CcpMonitoring {
  id             String   @id @default(uuid())
  haccpPlanId    String                         // → HaccpPlan
  workOrderId    String?                        // → WorkOrder (선택)
  lotNo          String?
  monitoredAt    DateTime
  measuredValue  String                         // 실측값
  result         String                         // pass|fail|deviation
  deviationNote  String?
  operatorId     String
}
```

#### HygieneCheck (위생점검)
```prisma
model HygieneCheck {
  id               String   @id @default(uuid())
  checkDate        DateTime
  shift            String                       // 1st|2nd|3rd
  area             String                       // production|storage|restroom|equipment|personnel
  checkedById      String
  items            String                       // JSON: 점검 항목별 결과
  result           String                       // pass|fail|conditional_pass
  failItems        String?
  correctiveAction String?
}
```

#### ForeignBodyReport (이물검출)
```prisma
model ForeignBodyReport {
  id              String   @id @default(uuid())
  reportNo        String   @unique
  detectedAt      DateTime
  detectionPoint  String                        // 금속검출기|X-RAY|육안
  foreignType     String                        // metal|glass|rubber|plastic|hair|insect|other
  size            String?
  disposition     String                        // recall|rework|scrap|use_as_is
  affectedQty     Int      @default(0)
  status          String   @default("open")     // open|closed
}
```

#### AllergenCode (알레르기 코드 마스터)
```prisma
model AllergenCode {
  id       String  @id @default(uuid())
  code     String  @unique
  name     String                       // 알레르기 유발 식품명
  nameEn   String?                      // 영문명
  isActive Boolean @default(true)
}
```

### 4.2 기존 모델 확장

#### Product 확장 (식품 속성 추가)
```prisma
// 기존 Product 모델에 추가된 필드
shelfLifeDays  Int?     // 유통기한(일)
storageTemp    String?  // 보관온도 ("0~5℃", "상온")
allergenInfo   String?  // 알레르기 정보 (JSON list)
isHaccp        Boolean  @default(false)
netWeight      Float?   // 내용량 (g 또는 ml)
```

#### Material 확장 (원료 속성 추가)
```prisma
// 기존 Material 모델에 추가된 필드
originCountry  String?  // 원산지
expiryDays     Int?     // 원료 유효기간(일)
storageTemp    String?  // 보관온도
allergenFlag   String?  // 알레르기 유발 여부 (JSON)
isOrganic      Boolean  @default(false)
```

### 4.3 마이그레이션 전략

- **파일**: `prisma/migrations/20260221100000_food_domain_extension/migration.sql`
- **전략**: 기존 테이블 무변경, 신규 테이블/컬럼 추가만 (Non-breaking)
- **알레르기 초기 데이터**: 마이그레이션 SQL 내 21종 시드 포함 (식품위생법 기준)
- **Cloud Run**: `prisma migrate deploy` 자동 실행 (CMD 스크립트)

---

## 5. API 설계 (Phase 3)

### 5.1 신규 API 엔드포인트

모든 API는 `src/lib/api/with-auth.ts` + `src/lib/api/api-response.ts` 패턴 준수.

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/recipes` | 배합비 목록 (productId, status 필터) | 인증 필요 |
| POST | `/api/recipes` | 배합비 생성 (ingredients 중첩 생성) | admin/manager/supervisor |
| GET | `/api/haccp` | HACCP 계획 목록 | 인증 필요 |
| POST | `/api/haccp` | HACCP 계획 등록 | admin/manager |
| GET | `/api/haccp/monitoring` | CCP 모니터링 기록 목록 | 인증 필요 |
| POST | `/api/haccp/monitoring` | CCP 모니터링 기록 등록 | 인증 필요 |
| GET | `/api/hygiene` | 위생점검 목록 | 인증 필요 |
| POST | `/api/hygiene` | 위생점검 기록 등록 | 인증 필요 |
| GET | `/api/foreign-body` | 이물검출 보고서 목록 | 인증 필요 |
| POST | `/api/foreign-body` | 이물검출 보고서 등록 | 인증 필요 |
| GET | `/api/allergens` | 알레르기 코드 목록 | 인증 필요 |
| GET | `/api/inventory/expiry` | 유통기한 관리 (expiryDays 기준 재고) | 인증 필요 |
| GET | `/api/inventory/origin` | 원산지별 원료 목록 | 인증 필요 |
| GET | `/api/production/batch` | 배치생산 목록 (WorkOrder 기반) | 인증 필요 |

### 5.2 응답 형식 (공통)

```typescript
// 성공
{ success: true, data: T }
// 성공 (페이지네이션)
{ success: true, data: T[], meta: { page, limit, total } }
// 실패
{ success: false, error: 'ERROR_CODE', message: '설명' }
```

### 5.3 API 상세: /api/recipes (GET)

```
Query: ?productId=xxx&status=approved
Include: product(code, name, category) + ingredients(material(code, name, unit))
OrderBy: product.name ASC, version DESC
```

---

## 6. UI 설계 (Phase 3)

### 6.1 공통 페이지 패턴

모든 식품 전용 페이지는 동일한 구조 사용:

```tsx
'use client';
// SWR or useEffect for data fetching
// 상단: 타이틀 + 아이콘 + 등록 버튼
// 중간: 필터 바
// 하단: 데이터 테이블
// 상태: loading skeleton / empty state / data table
```

### 6.2 신규 페이지 목록

| 페이지 | 경로 | 아이콘 | 주요 기능 |
|--------|------|--------|-----------|
| 배합비(레시피) 관리 | `/master/recipes` | `BookOpen` | 배합비 목록, 원료 구성 조회, 버전 관리 |
| 알레르기 코드 관리 | `/master/allergens` | `Leaf` | 21종 알레르기 코드 마스터 |
| HACCP 계획 관리 | `/food-safety/haccp` | `ShieldCheck` | CCP 목록, 위해요소 유형별 조회 |
| CCP 모니터링 | `/food-safety/ccp` | `Thermometer` | 모니터링 기록, pass/fail/deviation 현황 |
| 이물검출 관리 | `/food-safety/foreign` | `Microscope` | 이물보고서, 검출유형별 집계 |
| 위생점검 관리 | `/food-safety/hygiene` | `SprayCan` | 점검 기록, 구역별/교대별 현황 |
| 유통기한 관리 | `/inventory/expiry` | `Calendar` | 재고 유통기한, D-day 알림 |
| 원산지 관리 | `/inventory/origin` | `Globe` | 원료별 원산지, KPI 카드 (총수/국가수/유기농) |
| 배치생산 관리 | `/production/batch` | `FlaskConical` | 작업지시 배치 뷰, 상태 배지 |

### 6.3 배치생산 페이지 상태 배지

```typescript
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed:   { label: '완료',    color: 'bg-green-100 text-green-800' },
  in_progress: { label: '진행중',  color: 'bg-blue-100 text-blue-800' },
  issued:      { label: '작업지시', color: 'bg-yellow-100 text-yellow-800' },
  draft:       { label: '대기',    color: 'bg-gray-100 text-gray-800' },
  cancelled:   { label: '취소',    color: 'bg-red-100 text-red-800' },
};
```

### 6.4 원산지 관리 KPI 카드

```
[전체 원료 수] [원산지 국가 수] [유기농 원료 수]
+ 원산지 필터 드롭다운
+ 원료 테이블 (코드/원료명/원산지/규격/알레르기/유기농/공급업체)
```

### 6.5 대시보드 Food KPI (신규 추가)

기존 `getDashboardData()` Promise.all에 3개 쿼리 추가:

```typescript
// 1. HACCP 활성 계획 수
prisma.haccpPlan.count({ where: { status: 'active' } })
// → ShieldCheck 아이콘, green 색상

// 2. 이번달 위생점검 수
prisma.hygieneCheck.count({ where: { checkDate: { gte: monthStart } } })
// → SprayCan 아이콘, indigo 색상

// 3. 유통기한 임박 원료 (expiryDays <= 30)
prisma.material.count({ where: { expiryDays: { lte: 30, not: null } } })
// → Clock 아이콘, red/green 조건부 색상
```

---

## 7. 시드 데이터 설계 (Phase 4)

### 7.1 seed-kwangsung.mjs 식품 데이터

**거래처 (6개)**
```
이마트(주), 롯데마트(주), 홈플러스(주), 쿠팡(주), 현대백화점(주), 수출(Export)
```

**품목 (16개)**
```
소스류(SAU): 고추장소스, 갈릭소스, 데리야끼소스, 허니머스타드소스
장류(SRC): 고추장, 된장, 간장, 쌈장
드레싱(DRS): 참깨드레싱, 유자드레싱, 발사믹드레싱
즉석식품(RTE): 참치마요덮밥소스, 불고기소스, 짜장소스
수출: 한식소스세트, 한식장류세트
```

**원료 (20개)**
```
원료(14): 원당, 정제염, 식용유, 옥수수전분, 고추가루, 간장, 된장,
         마늘페이스트, 생강, 사과식초, 참기름, 참깨, 토마토페이스트, 물
포장재(6): 파우치250ml, 파우치500ml, 유리병200g, 유리병500g, 종이박스, 뚜껑
```

**공정 (32개)** — 4개 제품군별 8단계:
```
계량 → 배합 → 살균 → 냉각 → 충전 → 금속검출 → 포장 → 출하검사
```

**설비 (19대)**
```
배합기(3), 살균기(2), 레토르트(1), 냉각기(2), 충전기(3), 포장기(3),
금속검출기(2), X-RAY 검사기(1), 냉장창고(1), 냉동창고(1)
```

---

## 8. 파일 구조 요약

```
prisma/
  schema.prisma                                  # Recipe, HaccpPlan 등 7개 모델 추가
  migrations/
    20260221100000_food_domain_extension/
      migration.sql                              # Non-breaking DDL + 알레르기 21종 시드
  seed-kwangsung.mjs                             # 니즈푸드 마스터 데이터 (upsert-safe)

src/
  app/
    layout.tsx                                   # metadata: 니즈푸드 MES
    login/page.tsx                               # 녹색 브랜딩
    (dashboard)/
      dashboard/page.tsx                         # Food KPI 3종 추가
      master/
        recipes/page.tsx                         # 배합비 관리
        allergens/page.tsx                       # 알레르기 코드 관리
      food-safety/
        haccp/page.tsx                           # HACCP 계획관리
        ccp/page.tsx                             # CCP 모니터링
        foreign/page.tsx                         # 이물검출관리
        hygiene/page.tsx                         # 위생점검관리
      inventory/
        expiry/page.tsx                          # 유통기한관리
        origin/page.tsx                          # 원산지관리 (신규)
      production/
        batch/page.tsx                           # 배치생산관리 (신규)
    api/
      recipes/route.ts                           # GET+POST
      haccp/route.ts                             # GET+POST
      haccp/monitoring/route.ts                  # GET+POST
      hygiene/route.ts                           # GET+POST
      foreign-body/route.ts                      # GET+POST
      allergens/route.ts                         # GET
      inventory/origin/route.ts                  # GET (신규)
      production/batch/route.ts                  # GET (신규)
  components/
    layout/Sidebar.tsx                           # 식품 메뉴 구조, 녹색 브랜딩
  middleware.ts                                  # /food-safety RBAC 추가
```

---

## 9. 설계 결정 사항

| # | 결정 | 이유 |
|---|------|------|
| D1 | 기존 모델 파괴 없이 확장 | 기존 데이터 보존, Non-breaking 마이그레이션 |
| D2 | allergenInfo를 JSON string으로 저장 | 별도 관계 테이블 없이 단순화 |
| D3 | 배치생산을 WorkOrder 기반으로 구현 | 별도 Batch 테이블 없이 기존 WorkOrder 재활용 |
| D4 | AllergenCode 초기 21종을 migration.sql에 포함 | 앱 기동 전 DB에 마스터 데이터 보장 |
| D5 | Food Safety 대메뉴를 별도 그룹으로 분리 | 식품위생 업무의 독립성 강조 |
| D6 | 위생점검 items 필드를 JSON string으로 저장 | 점검 항목 유연성 (품목 추가/삭제 용이) |
