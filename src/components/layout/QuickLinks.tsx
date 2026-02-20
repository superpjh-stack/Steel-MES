'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NAV_ITEMS } from './Sidebar';

const STORAGE_RECENT = 'mes-nav-recent';
const MAX_RECENT = 6;

// 대메뉴 + 하위메뉴를 모두 flat하게
const ALL_ITEMS = NAV_ITEMS.flatMap((i) =>
  i.children
    ? i.children.map((c) => ({ href: c.href, label: c.label, icon: c.icon }))
    : [{ href: i.href, label: i.label, icon: i.icon }],
);

export default function QuickLinks() {
  const pathname = usePathname();
  const [recent, setRecent] = useState<string[]>([]);

  // 현재 경로에서 가장 구체적으로 매칭되는 메뉴 찾기
  useEffect(() => {
    const matched = ALL_ITEMS
      .filter((i) => pathname === i.href || pathname.startsWith(i.href + '/'))
      .sort((a, b) => b.href.length - a.href.length)[0]; // 가장 구체적인 것
    if (!matched) return;

    setRecent((prev) => {
      const next = [matched.href, ...prev.filter((h) => h !== matched.href)].slice(0, MAX_RECENT);
      localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
      return next;
    });
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_RECENT);
    if (saved) { try { setRecent(JSON.parse(saved)); } catch {} }
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-400 mr-1">최근:</span>
      {recent.map((href) => {
        const item = ALL_ITEMS.find((i) => i.href === href);
        if (!item) return null;
        const Icon = item.icon;
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Icon size={11} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
