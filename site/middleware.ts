import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Admin authentication middleware
function adminMiddleware(request: NextRequest) {
  // Skip authentication for login page
  if (request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  // Check for admin authentication
  const isAuthenticated = request.cookies.get('admin_authenticated')?.value === 'true';
  const role = request.cookies.get('bp_role')?.value;
  const hasUserSession = !!request.cookies.get('bp_session')?.value;
  
  // Require explicit admin role cookie to access admin routes.
  // This prevents customers with a lingering admin cookie from accessing admin.
  if (!isAuthenticated || role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // If a normal user session exists and is not marked admin, block access.
  // Admin login does not create a bp_session; customer login does.
  if (hasUserSession && role !== 'admin') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return NextResponse.next();
}

// Internationalization middleware
const intlMiddleware = createMiddleware({
  // Supported locales
  locales: ['en', 'hi', 'mr'],
  // Default locale when visiting /
  defaultLocale: 'en',
});

// Combined middleware
export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locales = ['en', 'hi', 'mr'];
  const isLocalizedAdmin = locales.some((l) => pathname.startsWith(`/${l}/admin`));

  // Force all localized admin routes to non-localized /admin
  // e.g., /en/admin/products -> /admin/products
  if (isLocalizedAdmin) {
    const localeMatch = pathname.match(/^\/(en|hi|mr)\/admin(\/.*)?$/);
    const suffix = localeMatch?.[2] || '';
    const targetPath = `/admin${suffix}`;
    const url = new URL(targetPath + request.nextUrl.search, request.url);
    return NextResponse.redirect(url);
  }

  // Handle admin routes (including localized paths like /en/admin)
  if (pathname.startsWith('/admin')) {
    return adminMiddleware(request);
  }
  // Protect admin APIs server-side via middleware
  if (pathname.startsWith('/api/admin')) {
    return adminMiddleware(request);
  }
  
  // Handle other routes with intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match admin routes and internationalized pathnames
  matcher: ['/admin/:path*', '/api/admin/:path*', '/((?!api|_next|.*\\..*).*)'],
};


