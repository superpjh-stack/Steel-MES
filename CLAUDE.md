# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Food-MES** — Manufacturing Execution System for a food processing operation (니즈푸드 / Nize Food).
Built with Next.js 14 App Router + Prisma + PostgreSQL. Fully deployed on Google Cloud Run + Cloud SQL.

## Development Commands

```bash
npm run dev          # Start dev server (Next.js)
npm run build        # Production build
npm run typecheck    # TypeScript check without emitting
npm run lint         # ESLint

npm run db:migrate   # Run pending Prisma migrations (dev)
npm run db:seed      # Seed via ts-node (prisma/seed.ts)
npm run db:studio    # Prisma Studio GUI
npm run db:generate  # Regenerate Prisma client after schema change
```

**Local DB (Docker):**
```bash
docker compose up -d db    # Start only PostgreSQL
docker compose up          # Start PostgreSQL + app
```

**Required env vars** (`.env.local` for dev):
```
DATABASE_URL=postgresql://mes_user:mes_secure_pw@localhost:5432/mes_db
NEXTAUTH_SECRET=<min-32-chars>
NEXTAUTH_URL=http://localhost:3000
```

**Login:** Username `admin` is resolved to `admin@mes.local`. All users follow the `{username}@mes.local` pattern.

## Architecture

### Route Groups
- `src/app/(dashboard)/` — Management screens (supervisor, manager, admin): dashboard, production, quality, equipment, inventory, shipments, sales-orders, monitoring, master, admin, pop
- `src/app/(operator)/` — Shop-floor POP (Point of Production) for operators
- `src/app/api/` — REST API routes (20+ resource modules)
- `src/app/login/` — Public login page

### Authentication & Authorization
- **NextAuth v5 (beta)** with credentials provider (`src/auth.ts`)
- Credentials: `username` + `password`; username is auto-converted to `{name}@mes.local` email
- JWT session strategy; `role` is embedded in the JWT token
- **Middleware RBAC** (`src/middleware.ts`): protects routes by role. Operators land on `/operator`, all others on `/dashboard`
- Roles: `admin > manager > supervisor > qc / me > operator / viewer`

### API Pattern
All API handlers use two helpers from `src/lib/api/`:

```ts
// with-auth.ts — wraps handler with session check + optional role enforcement
export const GET = withAuth(async (req, ctx, user) => { ... }, ['admin', 'manager']);

// api-response.ts — consistent response shape { success, data?, error?, meta? }
return ok(data);           // 200
return created(data);      // 201
return fail(404, 'NOT_FOUND', 'message');
const { page, limit, skip } = parsePagination(req.nextUrl);
```

### Data Layer
- **Prisma singleton** at `src/lib/prisma.ts` — one client instance shared across hot reloads
- Schema: `prisma/schema.prisma` — PostgreSQL with snake_case column names mapped to camelCase fields
- **Sequence table** (`Sequence` model) used for race-condition-safe WO/NCR/SHP number generation via `src/lib/services/sequence.service.ts`

### Key Domain Models
`WorkOrder` → `ProductionLog` → `DefectLog` / `InspectionRecord` → `NonconformanceReport`
`Customer` → `SalesOrder` → `CustomerRequirement` / `ContractDocument`
`Equipment` → `EquipmentLog` / `MaintenanceRecord` / `SpcMeasurement`
`LotTraceability` links material → WO → product for full traceability
`Inventory` + `InventoryMovement` for stock management

Enum-like string fields (stored as plain strings, documented in schema comments):
- `UserRole`: operator | qc | me | supervisor | manager | admin
- `WoStatus`: draft | issued | in_progress | completed | cancelled
- `InspType`: incoming | in_process | outgoing

### Frontend Patterns
- **SWR** for data fetching in client components
- **react-hook-form + zod** for form validation
- **Recharts** for charts/KPI displays
- **Tailwind CSS** with `clsx` + `tailwind-merge` (`cn()` utility pattern)
- **lucide-react** for icons
- `html5-qrcode` / `jsbarcode` for barcode/QR scanning and printing

## Deployment

**Docker Compose** (on-prem / local): `docker-compose.yml` — runs PostgreSQL + Next.js app together.

**Google Cloud Run** (production): `cloudbuild.yaml` triggers on push to `main`.
- Secrets managed via Google Secret Manager: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- On container start: runs `prisma migrate deploy`, then `seed-kwangsung.mjs` (master upserts), then `seed-full.mjs` (demo data upserts), then `node server.js`
- If migration fails with P3009 (failed migration state), the CMD auto-drops and recreates the public schema before retrying

## Seed Scripts
| Script | Purpose |
|--------|---------|
| `prisma/seed-kwangsung.mjs` | Master data: accounts, customers, equipment, products, processes, materials (upsert-safe) |
| `prisma/seed-full.mjs` | Full demo data across all modules (upsert-safe) |
| `prisma/seed-pop.mjs` | POP-specific demo data |
| `prisma/seed.ts` | Legacy ts-node seed (used by `npm run db:seed`) |

## bkit PDCA Status
- bkit PDCA pipeline active (`docs/.pdca-status.json`, `docs/.bkit-memory.json`)
- Feature `responsive-web` is at completed phase (90% match rate)
- Use `/pdca plan {feature}` before starting any new feature
