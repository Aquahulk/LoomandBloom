import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function toCsv(rows: any[], headers: string[]): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export async function GET(_req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['id','name','email','phone','isVerified','isOnHold','createdAt'];
    const rows = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      isVerified: u.isVerified,
      isOnHold: u.isOnHold,
      createdAt: u.createdAt.toISOString()
    }));

    const csv = toCsv(rows, headers);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv"`
      }
    });
  } catch (e) {
    console.error('Export users error:', e);
    return NextResponse.json({ error: 'Failed to export users' }, { status: 500 });
  }
}