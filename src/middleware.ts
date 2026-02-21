import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':        ['admin'],
  '/master':       ['supervisor', 'manager', 'admin'],
  '/dashboard':    ['supervisor', 'manager', 'admin'],
  '/sales-orders': ['supervisor', 'manager', 'admin'],
  '/pop':          ['operator', 'supervisor', 'manager', 'admin'],
  '/monitoring':   ['supervisor', 'manager', 'admin'],
  '/production':   ['supervisor', 'manager', 'admin'],
  '/quality':      ['qc', 'supervisor', 'manager', 'admin'],
  '/equipment':    ['me', 'supervisor', 'manager', 'admin'],
  '/inventory':    ['supervisor', 'manager', 'admin'],
  '/shipments':    ['supervisor', 'manager', 'admin'],
  '/operator':     ['operator', 'supervisor', 'admin'],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (req.auth) {
    const role = (req.auth.user as any)?.role as string;
    const defaultHome = role === 'operator' ? '/operator' : '/dashboard';

    if (pathname === '/login' || pathname === '/') {
      return NextResponse.redirect(new URL(defaultHome, req.url));
    }

    // Find the most specific (longest) matching route prefix
    const matched = Object.keys(ROLE_ROUTES)
      .filter((route) => pathname.startsWith(route))
      .sort((a, b) => b.length - a.length)[0];

    if (matched && !ROLE_ROUTES[matched].includes(role)) {
      const fallback = role === 'operator' ? '/operator' : '/dashboard';
      return NextResponse.redirect(new URL(fallback, req.url));
    }
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
