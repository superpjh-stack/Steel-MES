# Plan: quality-crud

## 개요
품질관리(Quality) 메뉴의 하단 페이지들에 CRUD 버튼을 추가한다.
현재 조회(Read)만 가능한 3개 페이지에 생성·수정·삭제 기능을 추가해 다른 관리 메뉴(품목, 고객사, 자재 등)와 동일한 UX를 제공한다.

## 대상 페이지

| 페이지 | 현재 상태 | 추가할 기능 |
|--------|-----------|-------------|
| `/quality/inspections` | 서버 컴포넌트, 조회만 | Create + Edit + Delete |
| `/quality/defects` | 서버 컴포넌트, 조회만 | Create + Edit + Delete |
| `/quality/ncr` | 서버 컴포넌트 + 상태변경만 | Create + Delete |
| `/quality/spc` | SPC 차트 필터만 | Create (측정값 등록) |
| `/quality/reports` | 집계 뷰 | 변경 없음 (집계 데이터라 CRUD 불필요) |

## 현재 API 현황

| API | GET | POST | PUT | DELETE |
|-----|-----|------|-----|--------|
| `/api/inspections` | ✅ | ✅ | ❌ 없음 | ❌ 없음 |
| `/api/defects` | ✅ | ✅ | ❌ 없음 | ❌ 없음 |
| `/api/ncr` | ✅ | ✅ | - | ❌ 없음 |
| `/api/spc/measurements` | ✅ | ✅ | ❌ 없음 | ❌ 없음 |

## 구현 범위

### 1. 검사 기록 (inspections)

**페이지 변환:**
- `page.tsx` → `'use client'` 클라이언트 컴포넌트로 전환
- 상태: `items`, `loading`, `modal`, `target`, `form`, `saving`, `error`

**등록 폼 필드:**
- 검사유형 (incoming/in_process/outgoing) — 필수
- WO번호 (workOrderId select) — 필수
- 로트번호 (lotNo) — 필수
- 샘플수량 (sampleQty) — 필수
- 합격수량 (passQty) — 필수
- 불합격수량 (failQty) — 필수
- 결과 (pass/fail/conditional) — 필수
- 검사일시 (inspectionDate) — 필수
- 메모 (notes) — 선택

**추가 API:**
- `PUT /api/inspections/[id]` — 기록 수정 (qc/supervisor/admin)
- `DELETE /api/inspections/[id]` — 기록 삭제 (admin만)

---

### 2. 불량 이력 (defects)

**페이지 변환:**
- `page.tsx` → `'use client'` 클라이언트 컴포넌트로 전환
- 파레토 요약은 클라이언트 사이드에서 재계산

**등록 폼 필드:**
- 불량코드 (defectCode) — 필수
- 불량명 (defectName) — 필수
- 수량 (qty) — 필수
- 처리방법 (disposition: rework/scrap/use_as_is/return) — 필수
- 근본원인 (rootCause) — 선택
- 시정조치 (correctiveAction) — 선택

**추가 API:**
- `PUT /api/defects/[id]` — 기록 수정 (qc/supervisor/admin)
- `DELETE /api/defects/[id]` — 기록 삭제 (admin만)

---

### 3. NCR (ncr)

**페이지 변환:**
- `page.tsx` → `'use client'` 클라이언트 컴포넌트로 전환
- 기존 `NcrActions` 컴포넌트는 유지 (상태변경 로직 분리 유지)

**등록 폼 필드:**
- inspectionId (select) — 필수 (검사 기록 연결)
- 처리방법 (disposition) — 필수
- 설명 (description) — 선택

**추가 API:**
- `DELETE /api/ncr/[id]` — NCR 삭제 (admin만)

---

### 4. SPC 측정값 (spc)

**페이지 변환:**
- `SpcPageClient.tsx`에 "측정값 등록" 버튼 추가

**등록 폼 필드:**
- workOrderId (select) — 필수
- characteristic (특성명) — 필수
- value (측정값) — 필수
- measuredAt (측정일시) — 필수

**추가 API:**
- `DELETE /api/spc/measurements/[id]` — 측정값 삭제

---

## 구현 패턴 (기존 코드와 동일)

```
Header: <h2>제목</h2> + <button onClick={openCreate}>+ 등록</button>
Row: <Pencil> 수정 + <Trash2> 삭제 버튼
Modal: create/edit 통합 + delete 확인 모달
API: withAuth(handler, ['qc', 'supervisor', 'admin'])
```

## 구현 순서

1. `inspections` 페이지 변환 + `[id]` API 추가
2. `defects` 페이지 변환 + `[id]` API 추가
3. `ncr` 페이지 변환 + DELETE API 추가
4. `spc` 측정값 등록 버튼 추가

## 완료 기준
- 품질관리 4개 페이지 모두 CRUD 버튼 표시
- TypeScript 오류 0
- 기존 조회 기능 정상 동작 유지
