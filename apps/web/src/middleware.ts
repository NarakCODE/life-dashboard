import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Note: localStorage is not accessible in middleware (runs on Edge).
  // We check for an access_token cookie if you migrate to cookie-based auth.
  // For now, we protect routes client-side via the layout and redirect there.
  // To enable server-side protection, set tokens as cookies in the API client.
  const token = request.cookies.get('access_token')?.value;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
