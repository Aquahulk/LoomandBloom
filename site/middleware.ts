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
  
  if (!isAuthenticated) {
    // Redirect to login page
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

  // Handle admin routes (including localized paths like /en/admin)
  if (pathname.startsWith('/admin') || isLocalizedAdmin) {
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


