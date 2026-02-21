'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ClipboardList, CheckSquare,
  Settings, Package, Truck, Wrench, SlidersHorizontal, X,
  ChevronDown, ChevronRight, Monitor, FileBarChart, AlertTriangle,
  ArrowLeftRight, Bell, Calendar, Users, Building2, Box, Layers,
  FlaskConical, GitBranch, Factory, ShoppingCart, Database,
  MonitorCheck, BarChart2, Cpu,
  Shield, Tag, ScrollText, HardDrive,
  History, CalendarDays, FileText, ClipboardCheck,
} from 'lucide-react';

export interface SubItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: SubItem[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
  },
  {
    href: '/master',
    label: '기준정보관리',
    icon: Database,
    children: [
      { href: '/master/customers',    label: '고객사',   icon: Building2 },
      { href: '/master/products',     label: '품목',     icon: Box },
      { href: '/master/materials',    label: '원자재',   icon: Layers },
      { href: '/master/equipment',    label: '설비',     icon: Wrench },
      { href: '/master/processes',    label: '공정',     icon: GitBranch },
      { href: '/master/defect-codes', label: '불량코드', icon: AlertTriangle },
    ],
  },
  {
    href: '/sales',
    label: '영업관리',
    icon: ShoppingCart,
    children: [
      { href: '/sales-orders',                 label: '수주등록조회',        icon: ShoppingCart },
      { href: '/sales/project-schedule',      label: '프로젝트일정관리',    icon: Calendar },
      { href: '/sales/customer-requirements', label: '고객요구사항관리',    icon: ClipboardCheck },
      { href: '/sales/change-history',        label: '수주변경이력관리',    icon: History },
      { href: '/sales/delivery-calendar',     label: '납기캘린더조회',      icon: CalendarDays },
      { href: '/sales/shipment-status',       label: '수주대비출고현황',    icon: BarChart2 },
      { href: '/sales/contracts',             label: '견적/계약문서첨부관리', icon: FileText },
    ],
  },
  {
    href: '/inventory',
    label: '재고관리',
    icon: Package,
    children: [
      { href: '/inventory',           label: '재고 현황',   icon: Package },
      { href: '/inventory/movements', label: '입출고 이력', icon: ArrowLeftRight },
      { href: '/inventory/alerts',    label: '재고 알림',   icon: Bell },
    ],
  },
  {
    href: '/production',
    label: '생산관리',
    icon: ClipboardList,
    children: [
      { href: '/production/work-orders', label: '작업지시',    icon: ClipboardList },
      { href: '/production/monitor',     label: '생산 모니터', icon: Monitor },
      { href: '/production/reports',     label: '생산 보고서', icon: FileBarChart },
    ],
  },
  {
    href: '/quality',
    label: '품질관리',
    icon: CheckSquare,
    children: [
      { href: '/quality/inspections', label: '검사 관리',   icon: CheckSquare },
      { href: '/quality/defects',     label: '불량 관리',   icon: AlertTriangle },
      { href: '/quality/ncr',         label: 'NCR',         icon: FileBarChart },
      { href: '/quality/spc',         label: 'SPC',         icon: FlaskConical },
      { href: '/quality/reports',     label: '품질 보고서', icon: FileBarChart },
    ],
  },
  {
    href: '/shipments',
    label: '출하관리',
    icon: Truck,
    children: [
      { href: '/shipments',                 label: '출하 목록', icon: Truck },
      { href: '/shipments/delivery-status', label: '배송 현황', icon: Monitor },
    ],
  },
  {
    href: '/pop',
    label: 'POP관리',
    icon: MonitorCheck,
  },
  {
    href: '/monitoring',
    label: '모니터링/KPI',
    icon: BarChart2,
    children: [
      { href: '/monitoring/productivity', label: '생산성', icon: FileBarChart },
      { href: '/monitoring/quality',      label: '품질',   icon: CheckSquare },
    ],
  },
  {
    href: '/equipment',
    label: '설비관리',
    icon: Wrench,
    children: [
      { href: '/equipment',             label: '설비 현황', icon: Wrench },
      { href: '/equipment/maintenance', label: '유지보수',  icon: Settings },
      { href: '/equipment/pm-schedule', label: 'PM 일정',   icon: Calendar },
    ],
  },
  {
    href: '/admin',
    label: '시스템관리',
    icon: Settings,
    children: [
      { href: '/admin/users',          label: '사용자계정등록',    icon: Users      },
      { href: '/admin/users/inquiry',  label: '사용자계정조회',    icon: Users      },
      { href: '/admin/roles',          label: '권한역할등록',      icon: Shield     },
      { href: '/admin/roles/inquiry',  label: '권한역할조회',      icon: Shield     },
      { href: '/admin/codes',          label: '공통코드등록',      icon: Tag        },
      { href: '/admin/codes/inquiry',  label: '공통코드조회',      icon: Tag        },
      { href: '/admin/logs',           label: '시스템로그조회',    icon: ScrollText },
      { href: '/admin/backup',         label: '데이터백업이력조회', icon: HardDrive  },
      { href: '/admin/interfaces',     label: '인터페이스관리',    icon: Cpu        },
    ],
  },
];

const STORAGE_ENABLED  = 'mes-nav-enabled-v2';
const STORAGE_OPEN     = 'mes-nav-open';

interface Props {
  userName: string;
  role: string;
  onClose?: () => void;
}

// 현재 경로가 속한 부모 메뉴 href 반환
function getActiveParent(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (!item.children) continue;
    if (pathname === item.href || pathname.startsWith(item.href + '/')) return item.href;
    for (const child of item.children) {
      if (pathname === child.href || pathname.startsWith(child.href + '/')) return item.href;
    }
  }
  return null;
}

export default function Sidebar({ userName, role, onClose }: Props) {
  const pathname = usePathname();

  const allHrefs = NAV_ITEMS.flatMap((i) =>
    i.children ? [i.href, ...i.children.map((c) => c.href)] : [i.href],
  );

  const [enabled,  setEnabled]  = useState<string[]>(allHrefs);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    const e = localStorage.getItem(STORAGE_ENABLED);
    const o = localStorage.getItem(STORAGE_OPEN);
    if (e) { try { setEnabled(JSON.parse(e)); } catch {} }
    // 저장된 열린 메뉴 or 현재 경로의 부모
    const parent = getActiveParent(pathname);
    setOpenMenu(o ? (JSON.parse(o) as string | null) : parent);
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 경로 변경 시 해당 섹션 자동 오픈
  useEffect(() => {
    if (!mounted) return;
    const parent = getActiveParent(pathname);
    if (parent) {
      setOpenMenu(parent);
      localStorage.setItem(STORAGE_OPEN, JSON.stringify(parent));
    }
  }, [pathname, mounted]);

  function toggleEnabled(href: string) {
    setEnabled((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      localStorage.setItem(STORAGE_ENABLED, JSON.stringify(next));
      return next;
    });
  }

  function handleParentClick(href: string) {
    if (editMode) {
      toggleEnabled(href);
      return;
    }
    // 아코디언: 이미 열려있으면 닫고, 아니면 오픈
    const next = openMenu === href ? null : href;
    setOpenMenu(next);
    localStorage.setItem(STORAGE_OPEN, JSON.stringify(next));
  }

  function isChildActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  function Toggle({ on }: { on: boolean }) {
    return (
      <span className={`relative inline-block w-8 h-4 rounded-full transition-colors shrink-0 ${on ? 'bg-blue-500' : 'bg-slate-600'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    );
  }

  const LogoBlock = () => (
    <div className="px-4 py-4 border-b border-slate-700/60">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Factory size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm text-white leading-tight">Metal-MES</h1>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors shrink-0"
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

  if (!mounted) return (
    <div id="dashboard-sidebar" className="w-52 h-full bg-slate-900 text-white flex flex-col">
      <LogoBlock />
    </div>
  );

  return (
    <div id="dashboard-sidebar" className="w-52 h-full bg-slate-900 text-white flex flex-col">
      <LogoBlock />

      {/* 네비게이션 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon      = item.icon;
          const hasChild  = !!item.children;
          const parentOn  = enabled.includes(item.href);
          const isOpen    = openMenu === item.href;
          const isParentActive = item.children
            ? item.children.some((c) => isChildActive(c.href))
            : isChildActive(item.href);

          // 단순 메뉴 (대시보드)
          if (!hasChild) {
            if (!editMode && !parentOn) return null;
            return (
              <div key={item.href} className="px-2 mb-0.5">
                {editMode ? (
                  <button
                    onClick={() => toggleEnabled(item.href)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${parentOn ? 'text-white' : 'text-slate-500'}`}
                  >
                    <span className="flex items-center gap-2.5"><Icon size={15} />{item.label}</span>
                    <Toggle on={parentOn} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isParentActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    <Icon size={15} />{item.label}
                  </Link>
                )}
              </div>
            );
          }

          // 하위메뉴 있는 경우
          const visibleChildren = editMode
            ? item.children!
            : item.children!.filter((c) => enabled.includes(c.href));

          if (!editMode && !parentOn && visibleChildren.length === 0) return null;

          const childHeight = (editMode ? item.children!.length : visibleChildren.length) * 34;

          return (
            <div key={item.href} className="px-2 mb-0.5">
              {/* 대메뉴 버튼 */}
              <button
                onClick={() => handleParentClick(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                  editMode
                    ? parentOn ? 'text-white' : 'text-slate-500'
                    : isParentActive || isOpen
                      ? 'text-white bg-slate-700/60'
                      : 'text-slate-300 hover:bg-slate-700/40 hover:text-white'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1 text-sm">{item.label}</span>
                {editMode ? (
                  <Toggle on={parentOn} />
                ) : (
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                  />
                )}
              </button>

              {/* 슬라이드 하위 메뉴 */}
              <div
                style={{
                  maxHeight: (isOpen || editMode) ? `${childHeight + 8}px` : '0px',
                  overflow: 'hidden',
                  transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div className="mt-0.5 ml-5 pl-3 border-l border-slate-700/50 space-y-0.5 pb-1">
                  {(editMode ? item.children! : visibleChildren).map((child) => {
                    const childOn = enabled.includes(child.href);
                    const active  = isChildActive(child.href);

                    if (editMode) {
                      return (
                        <button
                          key={child.href}
                          onClick={() => toggleEnabled(child.href)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${childOn ? 'text-slate-200' : 'text-slate-600'}`}
                        >
                          <span>{child.label}</span>
                          <Toggle on={childOn} />
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center px-2 py-1.5 rounded text-xs transition-colors ${
                          active
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* 메뉴 편집 버튼 */}
      <div className="px-2 pb-4 border-t border-slate-700/60 pt-3">
        <button
          onClick={() => setEditMode((v) => !v)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
            editMode ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
          }`}
        >
          {editMode ? <X size={13} /> : <SlidersHorizontal size={13} />}
          {editMode ? '편집 완료' : '메뉴 편집'}
        </button>
      </div>
    </div>
  );
}
