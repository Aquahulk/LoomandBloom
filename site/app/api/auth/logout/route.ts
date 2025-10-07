import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Redirect to homepage (303 to convert POST -> GET)
    const res = NextResponse.redirect(new URL('/', request.url), { status: 303 });

    // Clear the authenticated session cookie
    clearSessionCookie(res);

    return res;
  } catch (_) {
    // On error, still redirect to homepage to avoid leaving the user on a JSON page
    return NextResponse.redirect(new URL('/', request.url), { status: 303 });
  }
}