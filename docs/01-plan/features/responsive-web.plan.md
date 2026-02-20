# responsive-web Planning Document

> **Summary**: Steel-MES 전체 UI를 반응형 웹(모바일/태블릿/데스크톱)으로 전환
>
> **Project**: Steel-MES
> **Version**: 1.0.0
> **Author**: CTO Lead
> **Date**: 2026-02-21
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

현재 Steel-MES 대시보드 UI는 데스크톱 전용 고정 레이아웃(Sidebar w-52 = 208px 고정)으로 구현되어 있어, 모바일 및 태블릿 디바이스에서 사용이 불가능하다. 철강 제조 현장의 관리자/반장이 모바일 기기로 생산 현황을 확인하고, 태블릿으로 품질 데이터를 입력할 수 있도록 반응형 웹으로 전환한다.

### 1.2 Background

- 45개 페이지가 구현 완료된 상태 (dashboard 33 + operator 6 + login 1 + root 1 + admin-legacy 4)
- Sidebar는 항상 w-52(208px) 고정 노출 -- 모바일에서 화면 대부분 차지
- 모바일 햄버거 메뉴, 오버레이 드로어 미구현
- 테이블은 DataTable 컴포넌트에서만 overflow-x-auto 적용 (3곳)
- 반응형 Tailwind 클래스 사용이 매우 제한적 (hidden sm:block 등 layout.tsx에 4곳만 존재)
- Operator 레이아웃은 별도 구조로 이미 단순한 상단바 형태 (영향 적음)

### 1.3 Related Documents

- 현행 Sidebar: `src/components/layout/Sidebar.tsx`
- 현행 Dashboard Layout: `src/app/(dashboard)/layout.tsx`
- 현행 Operator Layout: `src/app/(operator)/layout.tsx`
- UI 컴포넌트: `src/components/ui/` (DataTable, Modal, KpiCard 등)
- Tailwind 설정: `tailwind.config.js` (커스텀 브레이크포인트 없음, 기본 Tailwind 사용)

---

## 2. Scope

### 2.1 In Scope

- [x] Sidebar 반응형 전환 (모바일 드로어, 태블릿 축소, 데스크톱 현행 유지)
- [x] Header 반응형 전환 (햄버거 버튼, 검색바 축소)
- [x] TabBar 모바일 대응 (숨김 or 축소)
- [x] PageTransition 패딩 반응형 조정
- [x] Dashboard 페이지 그리드 반응형 확인/보정
- [x] 모든 테이블 페이지에 overflow-x-auto 보장
- [x] Modal 모바일 풀스크린 대응
- [x] KpiCard 모바일 레이아웃 조정
- [x] 폼 페이지(WorkOrderForm 등) 모바일 패딩/그리드 조정

### 2.2 Out of Scope

- Operator 레이아웃 (`(operator)/layout.tsx`) -- 이미 단순 상단바 형태, 터치 최적화 별도 프로젝트
- PWA(Service Worker, 오프라인) 전환
- 네이티브 앱 변환 (React Native 등)
- 차트 컴포넌트(recharts) 반응형 -- recharts는 자체 ResponsiveContainer 사용
- 새로운 모바일 전용 페이지 추가

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 모바일(< 768px)에서 사이드바 숨김 + 햄버거 버튼으로 드로어 오픈 | High | Pending |
| FR-02 | 드로어 열림 시 배경 오버레이(backdrop) + 탭으로 닫기 | High | Pending |
| FR-03 | 태블릿(768~1024px)에서 사이드바 아이콘 전용 축소 모드 또는 드로어 | Medium | Pending |
| FR-04 | 데스크톱(1024px+)에서 기존 w-52 사이드바 유지 | High | Pending |
| FR-05 | Header에 모바일 햄버거 버튼(lg 미만에서 노출) | High | Pending |
| FR-06 | 모바일에서 TabBar 숨김 (공간 확보) | Medium | Pending |
| FR-07 | 모든 DataTable 사용 페이지에 가로 스크롤 보장 | High | Pending |
| FR-08 | Modal 모바일에서 거의 풀스크린 (mx-2, max-h-[95vh]) | Medium | Pending |
| FR-09 | PageTransition 패딩 모바일 p-3, 데스크톱 p-5 | Low | Pending |
| FR-10 | 대시보드 KPI 그리드: 모바일 1열/2열, 데스크톱 4열 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 반응형 전환으로 번들 크기 5KB 이내 증가 | next build 결과 비교 |
| Accessibility | WCAG 2.1 AA 유지 (기존 패턴 보존) | aria-label, 터치 타겟 44px 유지 |
| Usability | 모바일 터치 타겟 최소 44x44px | 시각적 검증 |
| Compatibility | Chrome/Safari/Edge 최신 2버전 | 크로스 브라우저 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 모바일(375px)에서 모든 대시보드 페이지 정상 표시
- [ ] 태블릿(768px)에서 사이드바 자연스럽게 축소/드로어
- [ ] 데스크톱(1280px+)에서 기존 UI와 동일
- [ ] 기존 접근성 패턴(aria-label, sr-only, aria-sort 등) 유지
- [ ] TypeScript 에러 0건 유지
- [ ] 기존 기능 회귀 없음

### 4.2 Quality Criteria

- [ ] Tailwind 클래스만 사용 (추가 CSS 최소화)
- [ ] 신규 의존성 0건 (Tailwind 기본 브레이크포인트 활용)
- [ ] 기존 컴포넌트 API 하위 호환성 유지

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sidebar 상태 관리 복잡도 증가 (드로어 open/close) | Medium | High | React state + CSS transition으로 최소화, Zustand 불필요 |
| 45개 페이지 일괄 그리드 변경 시 레이아웃 깨짐 | High | Medium | 단계별 적용 (레이아웃 -> 공통 컴포넌트 -> 개별 페이지) |
| 모바일 TabBar 숨김 시 네비게이션 UX 혼란 | Low | Medium | 모바일에서 사이드바 드로어가 대체 네비게이션 역할 |
| DataTable 가로 스크롤 시 첫 열 고정 요구 발생 가능 | Medium | Low | Phase 1에서는 단순 스크롤만, sticky 열은 후속 개선 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Dynamic** | Feature-based modules, fullstack | Steel-MES 현 구조 | !! |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Breakpoint 전략 | Tailwind 기본 (sm/md/lg/xl) / 커스텀 | Tailwind 기본 | 추가 설정 불필요, 표준 사용 |
| Sidebar 모바일 구현 | CSS-only / React state | React state + CSS transition | 드로어 열림/닫힘 상태 관리 필요 |
| 사이드바 상태 전달 | Props drilling / Context / URL param | Props + Layout 내 state | Dashboard Layout은 Server Component이므로 Client wrapper 필요 |
| 드로어 방식 | Sheet(라이브러리) / 자체 구현 | 자체 구현 | 외부 의존성 추가 불필요, Tailwind transition 충분 |
| 태블릿 사이드바 | 축소(아이콘만) / 드로어와 동일 | 드로어와 동일 (md~lg) | 아이콘 전용 모드는 복잡도 대비 효용 낮음 |

### 6.3 Tailwind Breakpoint 전략

```
Mobile First 접근법 사용:

< 640px  (기본)     : 모바일 -- 사이드바 숨김, 1~2열 그리드
>= 640px (sm:)      : 작은 태블릿 -- 검색바 노출
>= 768px (md:)      : 태블릿 -- 일부 그리드 확장
>= 1024px (lg:)     : 데스크톱 -- 사이드바 상시 노출, 4열 그리드
>= 1280px (xl:)     : 대형 모니터 -- 현행과 동일
```

### 6.4 변경 대상 파일 목록 (우선순위순)

#### Phase 1: 레이아웃 Shell (핵심, 1일)
| # | File | Change | Priority |
|---|------|--------|----------|
| 1 | `src/components/layout/Sidebar.tsx` | 드로어 모드 추가, lg: 이상만 상시 노출 | Critical |
| 2 | `src/app/(dashboard)/layout.tsx` | Server -> Client wrapper 추가, 햄버거 버튼, 사이드바 상태 관리 | Critical |
| 3 | `src/components/layout/TabBar.tsx` | 모바일 숨김 (hidden lg:flex) | High |
| 4 | `src/components/layout/PageTransition.tsx` | 패딩 p-3 lg:p-5 | Medium |

#### Phase 2: 공통 UI 컴포넌트 (0.5일)
| # | File | Change | Priority |
|---|------|--------|----------|
| 5 | `src/components/ui/DataTable.tsx` | 이미 overflow-x-auto 있음, 패딩 반응형 조정 | Low |
| 6 | `src/components/ui/Modal.tsx` | 모바일 mx-2, 풀스크린 옵션 | Medium |
| 7 | `src/components/ui/KpiCard.tsx` | 모바일 패딩/폰트 조정 확인 | Low |

#### Phase 3: 주요 페이지 (1일)
| # | File | Change | Priority |
|---|------|--------|----------|
| 8 | `src/app/(dashboard)/dashboard/page.tsx` | 그리드 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 | Medium |
| 9 | `src/app/(dashboard)/production/work-orders/page.tsx` | 테이블 반응형 확인 | Medium |
| 10 | `src/app/(dashboard)/production/monitor/page.tsx` | grid-cols-4 -> grid-cols-2 lg:grid-cols-4 | Medium |
| 11 | `src/app/(dashboard)/quality/reports/page.tsx` | grid-cols-4 -> 반응형 | Medium |
| 12 | 나머지 30+ 페이지 | grid-cols 반응형 패턴 일괄 적용 | Low |

#### Phase 4: 폼/상세 페이지 (0.5일)
| # | File | Change | Priority |
|---|------|--------|----------|
| 13 | `src/app/(dashboard)/production/work-orders/new/WorkOrderForm.tsx` | 이미 md: 반응형 적용, 확인 | Low |
| 14 | `src/app/(dashboard)/master/*/page.tsx` (6개) | 모달 내 폼 그리드 확인 | Low |
| 15 | `src/app/(dashboard)/sales-orders/page.tsx` | 모달 내 폼 grid-cols-2 -> grid-cols-1 sm:grid-cols-2 | Low |

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (`.eslintrc.*`)
- [x] TypeScript configuration (`tsconfig.json`)
- [x] Tailwind CSS configuration (`tailwind.config.js`)
- [x] Accessibility patterns documented in MEMORY.md

### 7.2 Responsive Convention to Establish

| Category | Rule |
|----------|------|
| **Mobile First** | 기본 스타일 = 모바일, sm:/md:/lg: 로 확장 |
| **Breakpoint 의미** | sm(640) = 큰 폰, md(768) = 태블릿, lg(1024) = 데스크톱 |
| **Sidebar 상태** | `useSidebar()` hook 또는 props로 관리 |
| **Grid 패턴** | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (KPI 기본) |
| **Table 패턴** | `overflow-x-auto` 필수 래핑 |
| **Touch Target** | 최소 44x44px (`min-w-[44px] min-h-[44px]`) |

---

## 8. Implementation Strategy

### 8.1 Sidebar 반응형 아키텍처 (핵심 설계)

```
[모바일 < lg]
  Layout.tsx:
    <div className="flex h-screen">
      {/* 사이드바 영역: lg 미만에서 오버레이 드로어 */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={close} />}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-52 bg-slate-900 transform transition-transform
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
        <Sidebar ... />
      </aside>

      <div className="flex-1 flex flex-col">
        <header>
          <button className="lg:hidden" onClick={toggle}>
            <Menu /> {/* 햄버거 */}
          </button>
          ...
        </header>
        ...
      </div>
    </div>

[데스크톱 >= lg]
  사이드바가 lg:relative lg:translate-x-0 으로 자연스럽게 위치
  기존 w-52 레이아웃 그대로 유지
```

### 8.2 구현 순서

1. **DashboardShell** 클라이언트 래퍼 컴포넌트 생성 (사이드바 상태 관리)
2. **Sidebar.tsx** 에 `onClose` prop 추가, 모바일 닫기 버튼
3. **layout.tsx** Server Component는 auth만 처리, Shell에 위임
4. **TabBar** 모바일 숨김
5. **PageTransition** 패딩 조정
6. 공통 UI 컴포넌트 (Modal, KpiCard)
7. 개별 페이지 그리드 보정

---

## 9. Next Steps

1. [ ] Write design document (`responsive-web.design.md`)
2. [ ] CTO review and approval
3. [ ] Phase 1 구현 시작 (Layout Shell)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-21 | Initial draft | CTO Lead |
