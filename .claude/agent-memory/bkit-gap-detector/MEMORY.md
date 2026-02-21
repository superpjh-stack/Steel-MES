# Gap Detector Memory - Food-MES (니즈푸드)

## Project Structure
- **Level**: Dynamic (Next.js 14 App Router + Prisma + PostgreSQL)
- **Design Doc (base)**: `docs/02-design/features/automotive-parts-mes.design.md`
- **Plan Doc (food)**: `docs/01-plan/features/food-mes-conversion.plan.md`
- **Schema**: `prisma/schema.prisma` - 24 models (17 base + 7 food domain)
- **Route Groups**: `(dashboard)` for admin/QC/supervisor, `(operator)` for touch UI
- **Components folder**: `src/components/` with ui/, charts/, operator/, work-orders/ subdirs
- **Branding**: 니즈푸드 MES, green theme (Leaf icon), food manufacturing focus

## Last Analysis (2026-02-20, v2)
- Overall Match Rate: 95%
- DB Schema: 100% | API: 100% (32/32) | Pages: 100% (27/27) | Components: 79% (15/19)
- Report: `docs/03-analysis/automotive-parts-mes.analysis.md`
- Missing: DefectPareto.tsx, SopViewer.tsx, 4 dashboard sub-components (inline)
- 4 bonus API routes beyond design: reports/production, ncr/[id], equipment/[id], products/[id] GET
- Layouts are inline in route layout.tsx files, not in components/layout/

## Design Sections Reference
- Section 2: DB Schema (2.1-2.7, 17 tables)
- Section 3: API Routes (3.1-3.8, ~32 endpoints)
- Section 4: Page Routes (4.1-4.9, ~27 pages)
- Section 5: Components (5.1-5.2, ~19 components)

## Analysis History
- v1 (2026-02-20): 37% match - pre-implementation baseline
- v2 (2026-02-20): 95% match - full implementation complete

## responsive-web Analysis (2026-02-21)
- Overall Match Rate: 90% (47/52 items)
- Report: `docs/03-analysis/responsive-web.analysis.md`
- DashboardShell: 100% | Sidebar: 100% | layout.tsx: 100% | PageTransition: 100%
- Modal: 60% (bottom sheet pattern missing) | FR: 70% | Accessibility: 100%
- GAPs: Modal bottom sheet, 2x KPI grid breakpoints (monitor/quality), TabBar lg:block vs lg:flex
- Immediate fixes: production/monitor + quality/reports KPI grid classes

## food-mes-conversion Analysis (2026-02-21, v3 FINAL)
- Overall Match Rate: 100% (32/32 items) -- up from 91% in v2
- Report: `docs/03-analysis/food-mes-conversion.analysis.md`
- Phase 1 Branding: 100% | Phase 2 Schema: 100% | Phase 3 Pages: 100% | Phase 4 Seed: 100%
- All gaps resolved: origin page, batch production page, dashboard food KPI
- New files: inventory/origin/page.tsx, production/batch/page.tsx, api/inventory/origin/route.ts, api/production/batch/route.ts
- Dashboard food KPI: HACCP count, hygiene count, expiry alert (lines 138-164)
- 7 food models, seed-kwangsung.mjs, food-safety RBAC all confirmed
