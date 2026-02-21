# [Check] Gap Analysis: food-mes-full

> **Date**: 2026-02-21
> **Feature**: food-mes-full (stub 페이지 완성 + 식품 데모 데이터)
> **Design Reference**: `docs/archive/2026-02/food-mes-conversion/food-mes-conversion.design.md`
> **Match Rate**: **95% (19/20)**

---

## 1. 원산지관리 페이지 (`/inventory/origin`)

### 1.1 페이지 (`src/app/(dashboard)/inventory/origin/page.tsx`)

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 1 | Material의 originCountry 필드 표시 | PASS | 테이블 컬럼에 원산지 뱃지로 표시 (line 133-136) |
| 2 | 원산지별 필터/검색 기능 | PASS | 드롭다운 필터 + 텍스트 검색 구현 (line 84-105) |
| 3 | 알레르기 원료 표시 | PASS | allergenFlag 표시 + KPI 카드에 알레르기 원료 수 (line 145-149, 78-80) |
| 4 | 보관온도(storageTemp) 표시 | PASS | 테이블 컬럼에 storageTemp 뱃지로 표시 (line 139-143) |
| 5 | KPI 카드 (총수/국가수/유기농) | PASS | 설계 6.4 기준 3개 + 알레르기 1개 = 4개 KPI (line 64-81) |

### 1.2 API (`src/app/api/inventory/origin/route.ts`)

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 6 | withAuth API 패턴 사용 | PASS | `withAuth(async (_req) => {...})` (line 6) |
| 7 | ok()/fail() response 패턴 사용 | PASS | `return ok(materials)` (line 28) |
| 8 | originCountry not null 필터 | PASS | `where: { originCountry: { not: null } }` (line 9) |

**소계: 8/8 (100%)**

---

## 2. 배치생산관리 페이지 (`/production/batch`)

### 2.1 페이지 (`src/app/(dashboard)/production/batch/page.tsx`)

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 1 | 배치번호(woNumber) 표시 | PASS | 테이블에 woNumber 표시 (line 165) |
| 2 | Recipe(배합비) 연동 | PASS | recipeVersion, batchSizeKg 표시 (line 173-181) |
| 3 | KPI 카드 (완료율, 생산량 등) | PASS | 4개 KPI: 전체/완료/총생산량/달성률 (line 82-101) |
| 4 | 상태 필터 기능 | PASS | 드롭다운 필터 + 텍스트 검색 (line 104-129) |
| 5 | STATUS_MAP 설계 일치 | PASS | 설계 6.3 STATUS_LABELS와 동일한 5개 상태/색상 (line 26-32) |
| 6 | SWR 사용 | PASS | `useSWR(url, fetcher)` (line 43) |

### 2.2 API (`src/app/api/production/batch/route.ts`)

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 7 | withAuth API 패턴 사용 | PASS | `withAuth(async (req) => {...})` (line 6) |
| 8 | WorkOrder 기반 (설계 D3) | PASS | `prisma.workOrder.findMany(...)` (line 10) |
| 9 | Recipe approved 연동 | PASS | `recipes: { where: { status: 'approved' }, take: 1 }` (line 18-19) |
| 10 | status 쿼리 필터 | PASS | `searchParams.get('status')` (line 8) |

**소계: 10/10 (100%)**

---

## 3. 대시보드 Food KPI (`/dashboard`)

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 1 | HACCP 활성 계획 수 | PASS | `prisma.haccpPlan.count({ where: { status: 'active' } })` (line 47) |
| 2 | 이번달 위생점검 수 | PASS | `prisma.hygieneCheck.count({ where: { checkDate: { gte: monthStart } } })` (line 48) |
| 3 | 유통기한 임박 원료 | PASS | `prisma.material.count({ where: { expiryDays: { not: null, lte: 30 } } })` (line 49) |
| 4 | CCP 합격률 표시 | PASS | ccpPassCount / ccpTotalCount (line 51-52, 62) |
| 5 | green 색상 사용 (HACCP) | PASS | `color="green"` (line 149) |
| 6 | indigo 색상 (위생) | PASS | `color="indigo"` (line 166) |
| 7 | red/green 조건부 (유통기한) | PASS | `color={expiryAlertCount > 0 ? 'red' : 'green'}` (line 174) |

**소계: 7/7 (100%) -- 설계 기준 3개 KPI + CCP 합격률 추가로 4개 구현**

---

## 4. seed-full.mjs 식품 데모 데이터

| # | 체크 항목 | 상태 | 비고 |
|---|-----------|------|------|
| 1 | AllergenCode 시드 데이터 | PASS | 15개 알레르기 코드 (line 611-635) |
| 2 | Recipe + RecipeIngredient 시드 | PASS | 6개 배합비 + 원료상세 (line 644-752) |
| 3 | HaccpPlan 시드 | PASS | 5개 HACCP 계획 (line 755-827) |
| 4 | CcpMonitoring 시드 | PASS | 12개 모니터링 기록 (line 830-865) |
| 5 | HygieneCheck 시드 | PASS | 10개 위생점검 (line 868-920) |
| 6 | ForeignBodyReport 시드 | PASS | 3개 이물검출 보고서 (line 923-975) |

**소계: 6/6 (100%)**

---

## 5. Gap 목록

| # | 항목 | 심각도 | 설명 |
|---|------|--------|------|
| G1 | seed-full.mjs 헤더 문구 | Low | 파일 상단 주석이 "광성정밀 전 메뉴 기본 데이터"로 구 명칭 유지 (line 3, 13). 실 동작에 영향 없음. |

---

## 6. Match Rate 계산

| 영역 | 항목 수 | Pass | Fail | Rate |
|------|---------|------|------|------|
| 원산지관리 페이지+API | 8 | 8 | 0 | 100% |
| 배치생산관리 페이지+API | 10 | 10 | 0 | 100% |
| 대시보드 Food KPI | 7 | 7 | 0 | 100% |
| seed-full.mjs | 6 | 6 | 0 | 100% |
| **전체** | **31** | **31** | **0** | **100%** |

> **최종 Match Rate: 100% (31/31)** -- Gap G1은 주석 명칭으로 기능 영향 없음 (cosmetic)

---

## 7. 요약

모든 설계 체크리스트 항목이 구현에 반영되어 있습니다.

- **원산지관리**: KPI 4종 (설계 3종 + 알레르기 추가), 필터/검색, withAuth+ok() 패턴 완비
- **배치생산관리**: WorkOrder 기반 배치 뷰, Recipe 연동, SWR+상태필터 완비
- **대시보드**: 설계 3종 KPI + CCP 합격률 추가 = 4종 Food KPI, 색상 설계 일치
- **seed-full.mjs**: 6개 식품 모델 전체 시드 데이터 완비 (AllergenCode 15종, Recipe 6종, HACCP 5종, CCP 12건, 위생 10건, 이물 3건)

**Cosmetic Gap**: seed-full.mjs 상단 주석의 "광성정밀" 문구 (기능 무관)
