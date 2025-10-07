import { NextRequest, NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/app/lib/settings';
import { hashPassword } from '@/app/lib/password';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authenticated')?.value === 'true';
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    // If admin password provided, hash it and persist as passwordHash
    if (body?.admin?.password && typeof body.admin.password === 'string' && body.admin.password.trim()) {
      body.admin.passwordHash = hashPassword(body.admin.password);
      delete body.admin.password;
    }
    const updated = await saveSettings(body);
    return NextResponse.json({ ok: true, settings: updated });
  } catch (e: any) {
    console.error('Update settings error:', e);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}