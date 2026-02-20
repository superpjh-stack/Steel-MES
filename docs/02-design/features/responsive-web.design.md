# Responsive Web Design — Steel-MES

**Feature**: 반응형 웹 전환 (Desktop-only → Mobile/Tablet/Desktop)
**Author**: Frontend Architect
**Date**: 2026-02-21
**Status**: Ready for Implementation

---

## Table of Contents

1. [Functional Requirements](#1-functional-requirements)
2. [Breakpoint Strategy](#2-breakpoint-strategy)
3. [Component Architecture](#3-component-architecture)
4. [DashboardShell.tsx — 상세 설계 및 구현 코드](#4-dashboardshelltsx--상세-설계-및-구현-코드)
5. [Sidebar.tsx — 변경 사항](#5-sidebartsx--변경-사항)
6. [layout.tsx — 변경 사항](#6-layouttsx--변경-사항)
7. [Tailwind 반응형 클래스 패턴](#7-tailwind-반응형-클래스-패턴)
8. [Phase별 구현 파일 목록](#8-phase별-구현-파일-목록)
9. [구현 체크리스트](#9-구현-체크리스트)

---

## 1. Functional Requirements

| ID | 요구사항 | 브레이크포인트 |
|----|---------|-------------|
| FR-01 | 모바일(< 1024px)에서 Sidebar 기본 숨김 + 햄버거 버튼 → 드로어로 열림 | `< lg` |
| FR-02 | 드로어 오픈 시 배경 backdrop 오버레이 노출, 클릭/탭으로 드로어 닫힘 | `< lg` |
| FR-03 | 태블릿(768~1024px) 동일하게 드로어 방식 적용 (Sidebar 숨김) | `md ~ lg` |
| FR-04 | 데스크톱(1024px+) 기존 `w-52` 고정 사이드바 유지 | `>= lg` |
| FR-05 | Header에 햄버거 버튼 삽입, `lg:hidden` 으로 데스크톱에서 숨김 | `< lg` |
| FR-06 | TabBar 모바일에서 숨김 (`hidden lg:flex`) | `< lg` |
| FR-07 | 모든 DataTable 페이지에서 `overflow-x-auto` 보장 | 전체 |
| FR-08 | Modal 모바일 풀스크린 대응 (`mx-2 max-h-[95vh]`) | `< sm` |
| FR-09 | PageTransition 내 padding `p-3 lg:p-5` (현재 `p-5` 고정) | `< lg` |
| FR-10 | KPI 그리드 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | 이미 `grid-cols-2 lg:grid-cols-4` — `sm:` 확인 필요 |

---

## 2. Breakpoint Strategy

Tailwind CSS 기본 브레이크포인트를 그대로 사용한다. 새 breakpoint를 추가하지 않는다.

| 이름 | 기준 | 대상 디바이스 | 레이아웃 |
|-----|------|------------|---------|
| default (mobile) | 0 ~ 639px | 스마트폰 | Sidebar 숨김, 드로어 |
| `sm:` | 640px+ | 대형 스마트폰 | Sidebar 숨김, 드로어 |
| `md:` | 768px+ | 태블릿 | Sidebar 숨김, 드로어 |
| `lg:` | 1024px+ | 데스크톱 | Sidebar 고정 표시 |

**결정**: `lg` (1024px)를 모바일/데스크톱 분기 기준점으로 사용한다.

---

## 3. Component Architecture

### 3.1 현재 구조 (문제)

```
DashboardLayout (Server Component)
  ├── Sidebar (Client — w-52 고정, 모바일 대응 없음)
  └── div.flex-1
        ├── header (Server — 햄버거 버튼 없음)
        ├── TabBar (Client)
        └── PageTransition (Client)
              └── {children}
```

**문제점**: `layout.tsx`는 Server Component이므로 `useState`로 사이드바 상태를 직접 관리할 수 없다.
햄버거 버튼과 backdrop 같은 상호작용 요소는 Client Component에서만 동작한다.

### 3.2 변경 후 구조

```
DashboardLayout (Server Component) — 세션 획득 담당
  └── DashboardShell (Client Component) — 사이드바 상태 관리
        ├── backdrop overlay (fixed, z-40, lg:hidden)
        ├── aside wrapper
        │     └── Sidebar (Client — onClose prop 추가)
        └── div.flex-1
              ├── header (햄버거 버튼 포함, lg:hidden)
              ├── TabBar (hidden lg:flex)
              └── PageTransition (p-3 lg:p-5)
                    └── {children}
```

### 3.3 관계도

```
layout.tsx
  auth() → userName, role 획득
  └── <DashboardShell userName role>
            │
            │  [useState: sidebarOpen]
            │
            ├── backdrop: fixed inset-0 bg-black/50 z-40
            │   onClick → setSidebarOpen(false)
            │
            ├── <aside> wrapper: fixed lg:relative, z-50
            │   transform: translate-x-0 | -translate-x-full
            │   └── <Sidebar onClose={() => setSidebarOpen(false)} />
            │
            └── <div> main area
                  ├── <header>
                  │     <button aria-label="메뉴 열기" lg:hidden>
                  │       onClick → setSidebarOpen(true)
                  │     </button>
                  │     ... (기존 header 내용)
                  ├── <TabBar className="hidden lg:flex" />
                  └── <PageTransition padding="p-3 lg:p-5" />
```

---

## 4. DashboardShell.tsx — 상세 설계 및 구현 코드

**파일 경로**: `src/components/layout/DashboardShell.tsx`

**역할**: Server Component인 `layout.tsx`에서 받은 `Sidebar`와 `children`을 래핑하여
사이드바 열림/닫힘 상태(Client 상태)를 관리하는 Client 래퍼 컴포넌트.

### 4.1 Props 인터페이스

```typescript
interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  role: string;
}
```

### 4.2 전체 구현 코드

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TabBar from '@/components/layout/TabBar';
import PageTransition from '@/components/layout/PageTransition';
import HeaderClock from '@/components/layout/HeaderClock';
import { LogOut, Bell, Search } from 'lucide-react';

// ROLE 표시 데이터는 layout.tsx에서 이동하거나 공유 상수로 분리
const ROLE_LABEL: Record<string, string> = {
  admin:      '관리자',
  manager:    '매니저',
  supervisor: '반장',
  operator:   '작업자',
  qc:         '품질',
  viewer:     '조회',
};

const ROLE_COLOR: Record<string, string> = {
  admin:      'bg-red-500/20 text-red-300',
  manager:    'bg-purple-500/20 text-purple-300',
  supervisor: 'bg-blue-500/20 text-blue-300',
  operator:   'bg-green-500/20 text-green-300',
  qc:         'bg-teal-500/20 text-teal-300',
  viewer:     'bg-slate-500/20 text-slate-300',
};

function UserAvatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
        {initials}
      </div>
      <div className="text-left hidden sm:block">
        <p className="text-xs font-semibold text-white leading-tight">{name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLOR[role] ?? 'bg-slate-500/20 text-slate-300'}`}>
          {ROLE_LABEL[role] ?? role}
        </span>
      </div>
    </div>
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  role: string;
}

export default function DashboardShell({ children, userName, role }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // 라우트 변경 시 드로어 자동 닫기
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ESC 키로 드로어 닫기
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 드로어 열릴 때 body 스크롤 방지 (모바일)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ===== Backdrop (모바일/태블릿 드로어 배경) ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar Wrapper ===== */}
      {/*
        모바일: fixed, 초기 -translate-x-full → 열리면 translate-x-0
        데스크톱: relative, 항상 표시 (translate 무효화됨)
      */}
      <aside
        className={[
          // 위치: 모바일 fixed, 데스크톱 relative (flex 흐름에 포함)
          'fixed lg:relative',
          // z-index: 드로어는 backdrop(z-40)보다 위
          'z-50 lg:z-auto',
          // 높이
          'h-full lg:h-screen',
          // 슬라이드 트랜지션
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        aria-hidden={!sidebarOpen ? true : undefined}
        // 데스크톱에서는 aria-hidden 제거 (항상 visible)
        // Note: lg:aria-hidden=false는 Tailwind로 제어 불가 → JS로 처리
      >
        <Sidebar
          userName={userName}
          role={role}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ===== 메인 영역 ===== */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* 다크 헤더 */}
        <header className="bg-slate-900 px-4 py-2 flex items-center gap-3 shrink-0 border-b border-slate-700/60">

          {/* 햄버거 버튼 (lg 미만에서만 노출) */}
          <button
            type="button"
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
            aria-label={sidebarOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={20} />
          </button>

          {/* 로고 텍스트 영역 */}
          <div className="hidden md:flex items-center gap-2 mr-2 shrink-0">
            <div className="h-5 w-px bg-slate-600" />
            <span className="text-xs text-slate-400">Manufacturing Execution System</span>
          </div>

          {/* 검색바 */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="검색..."
                className="w-full bg-slate-800 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* 우측 */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <HeaderClock />
            <button
              type="button"
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              aria-label="알림"
            >
              <Bell size={16} />
            </button>
            <div className="h-5 w-px bg-slate-700" />
            <UserAvatar name={userName} role={role} />
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-md transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </form>
          </div>
        </header>

        {/* 탭 바 — 모바일 숨김 */}
        <div className="hidden lg:block">
          <TabBar />
        </div>

        {/* 컨텐츠 */}
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}
```

### 4.3 aria-hidden 처리 주의사항

`aside`에 `aria-hidden={!sidebarOpen ? true : undefined}` 를 적용하면
데스크톱(`lg+`)에서도 닫힘 상태일 때 aria-hidden이 붙는 문제가 생긴다.
이를 해결하기 위해 두 가지 방안 중 하나를 선택한다.

**방안 A** (권장): `useMediaQuery` 없이 CSS만 의존, aria-hidden은 모바일에서만 실질 효과를 내도록
`inert` 속성(HTML)을 사용한다. 단, inert 브라우저 지원을 확인해야 한다.

**방안 B** (현실적 대안): aria-hidden 제거하고, 닫힌 드로어는 `visibility: hidden`
(`invisible` + `lg:visible`) 으로 처리하여 스크린리더에서도 제외한다.

```tsx
// 방안 B 구현 — aside className에 추가
'invisible lg:visible',
sidebarOpen ? '!visible' : '',
```

구현자는 방안 B를 기본으로 채택하고, inert 지원이 확인되면 방안 A로 업그레이드한다.

---

## 5. Sidebar.tsx — 변경 사항

### 5.1 추가할 Prop

```typescript
// 기존
interface Props {
  userName: string;
  role: string;
}

// 변경 후
interface Props {
  userName: string;
  role: string;
  onClose?: () => void;  // 모바일 드로어에서 닫기 콜백
}
```

### 5.2 모바일 닫기 버튼

`LogoBlock` 내부 우측 상단에 닫기(X) 버튼을 추가한다. 이 버튼은 `lg:hidden` 으로
데스크톱에서는 표시하지 않는다.

```tsx
// Sidebar.tsx — LogoBlock 컴포넌트 수정
const LogoBlock = () => (
  <div className="px-4 py-4 border-b border-slate-700/60">
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
        <Factory size={16} className="text-white" />
      </div>
      <div className="flex-1">
        <h1 className="font-bold text-sm text-white leading-tight">Steel-MES</h1>
        <p className="text-xs text-slate-400 leading-tight">광성정밀</p>
      </div>
      {/* 모바일 닫기 버튼 */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          aria-label="메뉴 닫기"
        >
          <X size={18} />
        </button>
      )}
    </div>
    <div className="h-px bg-slate-700/50 -mx-4 mb-3" />
    <p className="text-xs text-slate-300 truncate">{userName}</p>
  </div>
);
```

### 5.3 `aside` 엘리먼트 수정

`DashboardShell`이 위치/트랜지션을 담당하는 `aside` 래퍼를 제공하므로,
`Sidebar` 자체의 `aside` 태그를 `div`로 교체하거나, `id` 속성을 추가한다.

```tsx
// 변경 전
<aside className="w-52 bg-slate-900 text-white flex flex-col shrink-0">

// 변경 후 — DashboardShell의 aside가 외부에 있으므로 div로 교체
<div
  id="dashboard-sidebar"
  className="w-52 h-full bg-slate-900 text-white flex flex-col shrink-0"
>
```

> `DashboardShell`의 `<aside>` 에 이미 `aria-controls="dashboard-sidebar"` 연결이 되어 있으므로,
> Sidebar 내부 루트 엘리먼트에 `id="dashboard-sidebar"` 를 부여한다.

### 5.4 Nav 링크 클릭 시 드로어 닫기

모바일에서 링크 클릭 후 드로어가 닫혀야 한다. 이는 `DashboardShell`의
`useEffect([pathname])` 이 처리하므로 Sidebar 내부에서 별도 처리 불필요.

---

## 6. layout.tsx — 변경 사항

### 6.1 변경 전

```tsx
export default async function DashboardLayout({ children }) {
  const session = await auth();
  // ...
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar userName={name} role={role} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header>...</header>   {/* Server Component 내 UI */}
        <TabBar />
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
```

### 6.2 변경 후

`layout.tsx`는 Server Component 성격을 유지한다.
`header`, `TabBar`, `PageTransition`의 렌더링 책임은 `DashboardShell`로 이관된다.

```tsx
// src/app/(dashboard)/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/layout/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  const user = session.user as { name?: string; role?: string };
  const role = user.role ?? 'viewer';
  const name = user.name ?? '';

  return (
    <DashboardShell userName={name} role={role}>
      {children}
    </DashboardShell>
  );
}
```

**유지되는 것**: `auth()` 세션 획득 + `redirect('/login')` — Server Component 로직.
**이전되는 것**: 레이아웃 HTML 구조, 헤더 UI, TabBar, PageTransition → `DashboardShell`.

---

## 7. Tailwind 반응형 클래스 패턴

### 7.1 사이드바 드로어 (DashboardShell)

| 요소 | 클래스 | 설명 |
|------|-------|------|
| Backdrop | `fixed inset-0 bg-black/50 z-40 lg:hidden` | 모바일에서만 표시 |
| aside wrapper (닫힘) | `fixed lg:relative z-50 lg:z-auto h-full transition-transform duration-300 ease-in-out -translate-x-full lg:translate-x-0` | 모바일: 화면 밖 |
| aside wrapper (열림) | `-translate-x-full` → `translate-x-0` | JS로 클래스 토글 |

### 7.2 햄버거 버튼

```
lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center
text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0
```

### 7.3 TabBar 컨테이너

```tsx
// 변경 전 (layout.tsx)
<TabBar />

// 변경 후 (DashboardShell.tsx)
<div className="hidden lg:block">
  <TabBar />
</div>
```

TabBar 자체는 수정하지 않는다. 컨테이너 `div`로 숨긴다.

### 7.4 PageTransition padding

```tsx
// src/components/layout/PageTransition.tsx
// 변경 전
<div key={pathname} className="page-fade-in flex-1 overflow-y-auto p-5">

// 변경 후
<div key={pathname} className="page-fade-in flex-1 overflow-y-auto p-3 lg:p-5">
```

### 7.5 KPI 그리드 (dashboard/page.tsx)

```tsx
// 현재 (이미 grid-cols-2 적용됨 — 확인 필요)
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// 목표 (FR-10)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

대시보드 실제 코드에서는 이미 `grid-cols-2 lg:grid-cols-4` 가 적용되어 있다.
FR-10은 `sm:grid-cols-2` 추가와 `grid-cols-1` 기본값으로 변경이 필요하다.

### 7.6 DataTable 래퍼 (각 페이지)

```tsx
// 각 테이블 페이지에서 적용 패턴
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">
    ...
  </table>
</div>
```

`min-w-[600px]` 은 테이블 컨텐츠 최소 너비에 따라 조정한다.

### 7.7 Modal 모바일 풀스크린 (공통 Dialog)

```tsx
// 공통 모달 wrapper 패턴
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
  <div className="
    w-full sm:max-w-lg
    max-h-[95vh] overflow-y-auto
    bg-white rounded-t-2xl sm:rounded-xl
    shadow-xl
    mx-0 sm:mx-4
  ">
    {/* modal content */}
  </div>
</div>
```

모바일에서 bottom sheet 패턴 적용 (`items-end`, `rounded-t-2xl`). `sm:` 이상에서 일반 센터 모달.

---

## 8. Phase별 구현 파일 목록

### Phase 1 — 핵심 레이아웃 (필수, 선행 작업)

| 파일 경로 | 작업 유형 | 변경 내용 |
|----------|---------|---------|
| `src/components/layout/DashboardShell.tsx` | **신규 생성** | 사이드바 상태 관리 Client 래퍼 전체 구현 |
| `src/components/layout/Sidebar.tsx` | **수정** | `onClose?: () => void` prop 추가, 모바일 X 버튼, 루트 `aside` → `div` |
| `src/app/(dashboard)/layout.tsx` | **수정** | 기존 UI 제거, `<DashboardShell>` 렌더링으로 교체 |
| `src/components/layout/PageTransition.tsx` | **수정** | `p-5` → `p-3 lg:p-5` |

### Phase 2 — 개별 페이지 반응형 (우선순위별 적용)

| 파일 경로 | 작업 유형 | 변경 내용 |
|----------|---------|---------|
| `src/app/(dashboard)/dashboard/page.tsx` | **수정** | KPI 그리드 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, 섹션 그리드 반응형 |
| `src/app/(dashboard)/production/work-orders/page.tsx` | **수정** | 테이블 `overflow-x-auto` 래퍼 |
| `src/app/(dashboard)/quality/*/page.tsx` | **수정** | 테이블 `overflow-x-auto` 래퍼 |
| `src/app/(dashboard)/inventory/page.tsx` | **수정** | 테이블 `overflow-x-auto` 래퍼 |
| `src/app/(dashboard)/shipments/page.tsx` | **수정** | 테이블 `overflow-x-auto` 래퍼 |
| 각 Modal 컴포넌트 | **수정** | 모바일 bottom sheet 패턴 |

### Phase 3 — 세부 조정 (QA 후 적용)

| 파일 경로 | 작업 유형 | 변경 내용 |
|----------|---------|---------|
| `src/components/ui/KpiCard.tsx` | **수정** | 모바일에서 compact 표시 (`text-2xl` → `text-xl`) |
| 각 페이지 필터/버튼 영역 | **수정** | `flex-wrap gap-2` 추가하여 모바일 줄바꿈 대응 |

---

## 9. 구현 체크리스트

### 기능 검증

- [ ] 모바일(375px)에서 Sidebar가 기본 숨겨져 있는가
- [ ] 햄버거 버튼 클릭 시 드로어가 왼쪽에서 슬라이드하며 열리는가
- [ ] Backdrop 클릭 시 드로어가 닫히는가
- [ ] ESC 키 입력 시 드로어가 닫히는가
- [ ] 드로어 내 메뉴 링크 클릭 후 드로어가 자동으로 닫히는가
- [ ] X 버튼 클릭 시 드로어가 닫히는가
- [ ] 데스크톱(1280px)에서 사이드바가 고정 표시되는가
- [ ] 데스크톱에서 햄버거 버튼이 표시되지 않는가
- [ ] 태블릿(768px)에서 드로어 방식으로 동작하는가
- [ ] TabBar가 모바일에서 숨겨지는가

### 접근성 검증 (WCAG 2.1 AA)

- [ ] 햄버거 버튼에 `aria-label="메뉴 열기"` / `"메뉴 닫기"` 가 상태에 따라 변경되는가
- [ ] 햄버거 버튼에 `aria-expanded` 가 올바른 상태를 반영하는가
- [ ] 햄버거 버튼이 최소 44x44px 터치 영역을 만족하는가
- [ ] Backdrop에 `aria-hidden="true"` 가 붙어 있는가
- [ ] X(닫기) 버튼에 `aria-label="메뉴 닫기"` 가 있는가
- [ ] X 버튼이 최소 44x44px 터치 영역을 만족하는가
- [ ] 닫힌 드로어가 스크린리더에서 읽히지 않는가 (invisible 또는 inert 처리)
- [ ] 알림 Bell 버튼에 `aria-label="알림"` 이 있는가

### 성능 검증

- [ ] DashboardShell이 불필요한 리렌더를 유발하지 않는가 (`useCallback` 사용 확인)
- [ ] 드로어 트랜지션이 GPU 가속(`transform`)을 사용하는가 (`translate-x-*` = GPU 가속)
- [ ] body scroll lock이 드로어 닫기 시 올바르게 해제되는가

### 레이아웃 검증

- [ ] 모바일에서 DataTable 페이지가 가로 스크롤 가능한가 (`overflow-x-auto`)
- [ ] KPI 그리드가 모바일 1열, sm 2열, lg 4열로 표시되는가
- [ ] PageTransition이 모바일에서 `p-3`, 데스크톱에서 `p-5` padding을 적용하는가
- [ ] 모달이 모바일에서 bottom sheet 또는 `mx-2 max-h-[95vh]` 로 표시되는가

---

## Appendix — 구현 시 주의사항

### A. Server/Client 경계

`layout.tsx`는 `async function`으로 유지해야 한다 (`auth()` 호출). `DashboardShell`은
`'use client'` 를 선언하므로, `layout.tsx`에서 `DashboardShell`로 넘기는 `children`은
RSC(React Server Component) 페이로드로 전달된다. 이 패턴은 Next.js App Router의
공식 권장 패턴이다.

### B. Sidebar의 localStorage 의존

`Sidebar.tsx`는 mount 시 `localStorage`에서 `enabled` 및 `openMenu` 상태를 읽는다.
이 로직은 변경하지 않는다. `onClose` prop만 추가한다.

### C. 드로어 z-index 스택

```
z-40: backdrop overlay
z-50: aside (드로어) — backdrop보다 위
z-auto: lg+ 에서는 일반 흐름 (z-index 불필요)
```

다른 UI 요소(Toast, Tooltip 등)의 z-index와 충돌하지 않도록 확인한다.

### D. 의존성 추가 금지

CTO 결정에 따라 새 npm 패키지를 설치하지 않는다.
- Headless UI, Radix Dialog, Framer Motion 사용 불가
- Tailwind CSS `transition-transform duration-300 ease-in-out` 만 사용
