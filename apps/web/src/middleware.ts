import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/api/proxy',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('forgeops_access_token');

  // Allow public paths and static assets
  if (isPublicPath(pathname) || pathname.startsWith('/_next') || pathname.includes('.')) {
    // If authenticated user hits /login or /register, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const url = request.nextUrl.clone();
      url.pathname = '/app/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protected routes require auth cookie
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
