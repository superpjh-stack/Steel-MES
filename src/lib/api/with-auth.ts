import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { fail } from './api-response';

export type UserRole = 'operator' | 'qc' | 'me' | 'supervisor' | 'manager' | 'admin';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

type RouteContext = { params: Record<string, string> };

type AuthHandler = (
  req: NextRequest,
  ctx: RouteContext,
  user: AuthenticatedUser,
) => Promise<NextResponse>;

/**
 * Wraps a Next.js API route handler with authentication and optional role enforcement.
 * Usage:
 *   export const GET = withAuth(async (req, ctx, user) => { ... });
 *   export const POST = withAuth(async (req, ctx, user) => { ... }, ['admin', 'manager']);
 */
export function withAuth(handler: AuthHandler, allowedRoles?: UserRole[]) {
  return async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user) {
      return fail(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = session.user as unknown as AuthenticatedUser;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return fail(403, 'FORBIDDEN', `Required role: ${allowedRoles.join(' | ')}`);
    }

    return handler(req, ctx, user);
  };
}
