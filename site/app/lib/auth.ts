import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'bp_session';
const ALG = 'HS256';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function base64url(input: Buffer | string): string {
  const buff = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buff.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export type SessionPayload = {
  email: string;
  name?: string;
  isAdmin?: boolean;
};

export function signSession(payload: SessionPayload, expiresInSeconds = 60 * 60 * 24 * 30) {
  const header = { alg: ALG, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const headerB64 = base64url(JSON.stringify(header));
  const bodyB64 = base64url(JSON.stringify(body));
  const data = `${headerB64}.${bodyB64}`;
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest();
  const sigB64 = base64url(sig);
  return `${data}.${sigB64}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const [headerB64, bodyB64, sigB64] = token.split('.');
    if (!headerB64 || !bodyB64 || !sigB64) return null;
    const data = `${headerB64}.${bodyB64}`;
    const expectedSig = base64url(crypto.createHmac('sha256', JWT_SECRET).update(data).digest());
    if (expectedSig !== sigB64) return null;
    const body = JSON.parse(Buffer.from(bodyB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (typeof body.exp === 'number' && Math.floor(Date.now() / 1000) > body.exp) return null;
    return { email: body.email, name: body.name };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function setSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = signSession(payload);
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({ name: COOKIE_NAME, value: '', maxAge: 0, path: '/' });
}