'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, Home } from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';

const STORAGE_KEY = 'mes-open-tabs-v3';

// sectionHref: 섹션 루트(탭 식별용), navHref: 마지막 방문 URL(탭 클릭 시 이동), label: 표시명
type Tab = { sectionHref: string; navHref: string; label: string };

function findSection(pathname: string): { sectionHref: string; label: string } | null {
  for (const item of NAV_ITEMS) {
    if (item.href === '/dashboard') continue;
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      return { sectionHref: item.href, label: item.label };
    }
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + '/')) {
          return { sectionHref: item.href, label: item.label };
        }
      }
    }
  }
  return null;
}

export default function TabBar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setTabs(JSON.parse(saved));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const section = findSection(pathname);
    if (!section) return;
    setTabs((prev) => {
      const exists = prev.some((t) => t.sectionHref === section.sectionHref);
      const next = exists
        // 이미 있는 탭이면 navHref만 현재 URL로 갱신
        ? prev.map((t) => t.sectionHref === section.sectionHref ? { ...t, navHref: pathname } : t)
        // 없으면 새 탭 추가
        : [...prev, { sectionHref: section.sectionHref, navHref: pathname, label: section.label }];
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [pathname, mounted]);

  const currentSection = findSection(pathname);
  const isHome = pathname === '/dashboard';

  function closeTab(sectionHref: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setTabs((prev) => {
      const next = prev.filter((t) => t.sectionHref !== sectionHref);
      try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    if (currentSection?.sectionHref === sectionHref) {
      router.push('/dashboard');
    }
  }

  return (
    <div className="flex items-stretch bg-white border-b tab-scrollbar overflow-x-auto shrink-0" style={{ minHeight: '38px' }}>
      {/* HOME */}
      <Link
        href="/dashboard"
        className={`flex items-center gap-1.5 px-4 text-sm border-b-2 transition-all whitespace-nowrap shrink-0 ${
          isHome
            ? 'border-blue-500 text-blue-600 font-semibold bg-blue-50/60'
            : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
        }`}
      >
        <Home size={13} />
        HOME
      </Link>

      {/* 섹션 탭들 */}
      {tabs.map((tab) => {
        const isActive = currentSection?.sectionHref === tab.sectionHref;
        return (
          <div
            key={tab.sectionHref}
            className={`flex items-center border-b-2 transition-all shrink-0 ${
              isActive
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-transparent hover:bg-gray-50'
            }`}
          >
            <Link
              href={tab.navHref}
              className={`px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </Link>
            <button
              onClick={(e) => closeTab(tab.sectionHref, e)}
              className="pr-2.5 text-gray-300 hover:text-gray-600 transition-colors"
              aria-label={`${tab.label} 탭 닫기`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
