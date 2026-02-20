# Security Architect Memory - Steel-MES

## Project Stack
- Next.js 14, Prisma ORM, PostgreSQL, NextAuth.js v5 (JWT strategy)
- Credentials-based auth with bcryptjs
- Zod for input validation
- On-premises deployment

## Key File Paths
- Auth config: `src/auth.ts`
- Middleware (RBAC pages): `src/middleware.ts`
- Prisma singleton: `src/lib/prisma.ts`
- API routes: `src/app/api/` (34+ route files)

## Security Findings (2026-02-20 review)
- See `security-review-2026-02-20.md` for full report
- Critical: No try/catch in any API route, no API route RBAC in middleware
- High: Race condition in WO/NCR number generation, no rate limiting
- Medium: No security headers in next.config, unsafe `as any` casts, no pagination limits
- Middleware only protects page routes, not `/api/*` routes (except `/api/auth`)
