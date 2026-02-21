# [Plan] Food MES Conversion — 니즈푸드 MES

**Feature**: food-mes-conversion
**Date**: 2026-02-21
**Level**: Enterprise (Dynamic baseline → Food domain upgrade)

---

## 목표

현재 자동차/금속 부품 MES를 **식품 제조 전문 MES(니즈푸드 Food-MES)**로 전환한다.
참고자료: `참고MES/니즈푸드 SM_메뉴구조도_20260107.pdf`

---

## 범위 (Scope)

### Phase 1 — 브랜딩 & 메뉴 구조 (즉시 반영)
- 로고/시스템명: `Metal-MES` → `니즈푸드 MES`
- 사이드바 네비게이션: 식품 업무 구조 재편
- 컬러 포인트: 파란색 → 녹색(식품/위생 이미지)

### Phase 2 — 스키마 확장 (식품 도메인 모델 추가)
- `Recipe` / `RecipeIngredient` (배합비/BOM)
- `HaccpPlan` / `CcpMonitoring` (HACCP/CCP)
- `HygieneCheck` (위생점검)
- `Allergen` (알레르기 코드)
- `Product` 확장: `shelfLifeDays`, `storageTemp`, `allergenIds`, `isHaccp`
- `Material` 확장: `originCountry`, `expiryDays`, `allergenIds`

### Phase 3 — 신규 페이지 (식품 전용 화면)
- 배합비관리 (Recipe 관리)
- HACCP/CCP 모니터링
- 위생점검 관리
- 알레르기 관리
- 유통기한/원산지 현황
- 대시보드 Food KPI 업데이트

### Phase 4 — 시드 데이터 교체
- 식품 제품 (소스류, 장류, 음료류)
- 식품 원료 (원당, 정제염, 식용유, 전분, 고추가루, 간장, etc.)
- 식품 공정 (배합 → 살균 → 냉각 → 충전 → 포장)
- 설비 (배합기, 살균기, 충전기, 포장기)

---

## 식품 MES 메뉴 구조 (니즈푸드 기준)

```
대시보드
기준정보관리
  ├ 거래처관리
  ├ 품목마스터관리
  ├ 원료/원자재관리
  ├ 배합비(레시피)관리  ← NEW
  ├ 설비마스터관리
  ├ 공정관리
  ├ 창고관리
  ├ 알레르기코드관리   ← NEW
  └ 불량코드관리
영업관리
  ├ 수주등록조회
  ├ 납기캘린더조회
  └ 수주대비출고현황
자재관리
  ├ 원료입고검사       ← 식품 특화
  ├ 재고현황
  ├ 입출고이력
  ├ 유통기한관리       ← NEW
  └ 원산지관리         ← NEW
생산관리
  ├ 작업지시
  ├ 생산실적
  ├ 생산모니터
  └ 배치생산관리       ← NEW (식품 배치)
품질관리
  ├ 수입검사
  ├ 공정검사
  ├ 완제품검사
  ├ 불량/NCR관리
  └ SPC
식품안전관리          ← NEW 대메뉴
  ├ HACCP 계획관리
  ├ CCP 모니터링
  ├ 이물검출관리
  └ 위생점검관리
출하관리
  ├ 출하목록
  ├ 배송현황
  └ LOT 추적조회      ← 식품 이력추적 강조
POP관리
모니터링/KPI
  ├ 생산현황
  ├ 생산실적
  ├ 출고현황
  └ KPI지표
설비관리
  ├ 설비현황
  ├ 유지보수
  └ PM 일정
시스템관리
  ├ 사용자관리
  ├ 권한관리
  ├ 공통코드관리
  └ 시스템로그
```

---

## 우선순위 (Priority)

| 우선순위 | 작업 | 기간 |
|---------|------|------|
| P0 | 브랜딩 + 메뉴 구조 변경 | Day 1 |
| P0 | 시드 데이터 식품화 | Day 1 |
| P1 | Prisma 스키마 식품 확장 | Day 1-2 |
| P1 | 배합비(Recipe) 관리 페이지 | Day 2 |
| P1 | 식품안전관리(HACCP) 페이지 | Day 2-3 |
| P2 | 대시보드 Food KPI | Day 3 |
| P2 | 유통기한/원산지 관리 | Day 3 |
