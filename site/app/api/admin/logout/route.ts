import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const res = NextResponse.redirect(new URL('/admin/login', req.url));
    // Clear admin auth cookie
    res.cookies.set({
      name: 'admin_authenticated',
      value: 'false',
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
    });
    // Clear role cookie
    res.cookies.set({
      name: 'bp_role',
      value: '',
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (_) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}