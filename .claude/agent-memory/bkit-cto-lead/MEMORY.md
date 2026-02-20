# CTO Lead Agent Memory - Steel-MES

## Project Structure
- **Stack**: Next.js 14 App Router + Prisma 5.x + PostgreSQL + NextAuth v5 + Tailwind CSS
- **Level**: Dynamic (fullstack, on-premise)
- **Package manager**: npm
- **Pages**: ~45 total (33 dashboard, 6 operator, login, root, 4 admin-legacy)

## Key Layout Files
- `src/components/layout/Sidebar.tsx` - Fixed w-52 (208px), no mobile support
- `src/app/(dashboard)/layout.tsx` - Server Component with auth, flex h-screen
- `src/components/layout/TabBar.tsx` - Section tabs, overflow-x-auto
- `src/components/layout/PageTransition.tsx` - p-5 fixed padding
- `src/app/(operator)/layout.tsx` - Simple topbar, already mobile-friendly

## Current PDCA Feature: responsive-web
- Phase: Plan (created 2026-02-21)
- Plan doc: `docs/01-plan/features/responsive-web.plan.md`
- Scope: Sidebar drawer, header hamburger, TabBar hide, grid responsive, table scroll

## Responsive Conversion Key Decisions
- Tailwind default breakpoints (sm/md/lg/xl), no custom config
- Mobile-first approach
- Sidebar: fixed overlay drawer on < lg, static w-52 on >= lg
- Need Client wrapper (DashboardShell) because layout.tsx is Server Component
- TabBar: hidden on mobile (lg:flex)
- No new dependencies

## Codebase Patterns
- DataTable already has overflow-x-auto (3 files)
- Grid patterns: grid-cols-2 lg:grid-cols-4 most common for KPI
- Modal uses max-w-sm/lg/2xl with mx-4
- Accessibility: aria-sort, sr-only captions, 44px touch targets
