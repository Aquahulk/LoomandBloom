import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setSessionCookie } from '@/app/lib/auth';

// Simple per-IP rate limit (use Redis in production)
const rlStore = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, windowMs = 60_000, max = 10) {
  const now = Date.now();
  const e = rlStore.get(ip);
  if (!e || now > e.reset) {
    rlStore.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (e.count >= max) return false;
  e.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const data = await request.json().catch(() => ({}));
    const email: string = (data?.email || '').toString().trim().toLowerCase();
    const password: string = (data?.password || '').toString();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || !password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, { email: user.email!, name: user.name });
    return res;
  } catch (_) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}