'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, Bell, Search, LogOut } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import TabBar from '@/components/layout/TabBar';
import PageTransition from '@/components/layout/PageTransition';
import HeaderClock from '@/components/layout/HeaderClock';

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
    if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
  }, [sidebarOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 드로어 열릴 때 body 스크롤 방지 (모바일)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* Backdrop — 모바일/태블릿 드로어 배경 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper
          모바일: fixed + 슬라이드 트랜지션 (드로어)
          데스크톱(lg+): relative + 항상 표시
      */}
      <aside
        className={[
          'fixed inset-y-0 left-0 lg:relative lg:inset-auto',
          'z-50 lg:z-auto',
          'transition-transform duration-300 ease-in-out',
          // 스크린리더: 닫힌 드로어 숨김(invisible), 데스크톱 항상 표시(lg:visible)
          'invisible lg:visible',
          sidebarOpen ? 'translate-x-0 !visible' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <Sidebar
          userName={userName}
          role={role}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* 메인 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* 다크 헤더 */}
        <header className="bg-slate-900 px-4 py-2 flex items-center gap-3 shrink-0 border-b border-slate-700/60">

          {/* 햄버거 버튼 — lg 미만에서만 노출 */}
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

          {/* 로고 텍스트 */}
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

          {/* 우측 영역 */}
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

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-md transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </header>

        {/* 탭 바 — 모바일에서 숨김 */}
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
