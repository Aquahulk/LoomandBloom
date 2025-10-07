import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/app/lib/settings';
import { verifyPassword } from '@/app/lib/password';

// Hardcoded secret admin (stored with hashed password)
const SECRET_ADMIN = {
  username: 'prem.pthakkar7@gmail.com',
  // bcrypt hash for password "prempthakkar7" with cost 12
  passwordHash: '$2b$12$4/bqhn/tCryVjoGpDXQ90uj5C/XSC7DeKJxzEI4AQVoxtK1Ce44V.'
};

// Simple in-memory rate limit and backoff store (use Redis in production)
const rateStore = new Map<string, { count: number; resetTime: number; failures: number; lockUntil: number }>();

function getIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr.trim();
  return 'unknown';
}

function rateLimitAndBackoff(ip: string): { allowed: boolean; waitMs: number } {
  const now = Date.now();
  const windowMs = 60_000; // 1 minute window
  const maxReq = 10; // 10 requests per window
  const entry = rateStore.get(ip) || { count: 0, resetTime: now + windowMs, failures: 0, lockUntil: 0 };

  // Lockout check
  if (entry.lockUntil && now < entry.lockUntil) {
    return { allowed: false, waitMs: entry.lockUntil - now };
  }

  // Reset window
  if (now >= entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  if (entry.count >= maxReq) {
    rateStore.set(ip, entry);
    return { allowed: false, waitMs: entry.resetTime - now };
  }

  entry.count++;
  rateStore.set(ip, entry);
  return { allowed: true, waitMs: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req);
    const rl = rateLimitAndBackoff(ip);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'Too many requests. Please retry later.' }, { status: 429 });
    }

    const body = await req.json();
    const { username, password } = body || {};
    const settings = await getSettings();
    const adminUser = settings.admin?.username || 'admin';
    const passwordHash = settings.admin?.passwordHash || '';

    // Check either persisted admin or hardcoded secret admin
    const isSettingsAdmin = username === adminUser && verifyPassword(password || '', passwordHash);
    const isSecretAdmin = username === SECRET_ADMIN.username && verifyPassword(password || '', SECRET_ADMIN.passwordHash);
    const success = isSettingsAdmin || isSecretAdmin;

    if (success) {
      // Reset failures on success
      const entry = rateStore.get(ip);
      if (entry) {
        entry.failures = 0;
        entry.lockUntil = 0;
        rateStore.set(ip, entry);
      }
      const res = NextResponse.json({ ok: true });
      res.cookies.set({
        name: 'admin_authenticated',
        value: 'true',
        httpOnly: true,
        path: '/'
        ,
        sameSite: 'strict',
        maxAge: 60 * 60, // 1 hour session
        secure: process.env.NODE_ENV === 'production',
      });
      return res;
    }

    // Failed auth: apply exponential backoff and potential lockout
    const entry = rateStore.get(ip) || { count: 1, resetTime: Date.now() + 60_000, failures: 0, lockUntil: 0 };
    entry.failures = (entry.failures || 0) + 1;
    // Exponential backoff up to 60s
    const delaySec = Math.min(2 ** entry.failures, 60);
    entry.lockUntil = Date.now() + delaySec * 1000;
    // Account lockout after 5 consecutive failures for 15 minutes
    if (entry.failures >= 5) {
      entry.lockUntil = Date.now() + 15 * 60 * 1000;
    }
    rateStore.set(ip, entry);

    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (_) {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}