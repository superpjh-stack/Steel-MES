# Gap Detector Memory - Steel-MES

## Project Structure
- **Level**: Dynamic (Next.js 14 App Router + Prisma + PostgreSQL)
- **Design Doc**: `docs/02-design/features/automotive-parts-mes.design.md`
- **Schema**: `prisma/schema.prisma` - 17 models, 7 enums (fully implemented)
- **Route Groups**: `(dashboard)` for admin/QC/supervisor, `(operator)` for touch UI
- **Components folder**: `src/components/` with ui/, charts/, operator/, work-orders/ subdirs

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
