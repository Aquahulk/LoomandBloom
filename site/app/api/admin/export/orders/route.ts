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

export async function GET(req: NextRequest) {
  try {
    const isAdmin = req.cookies.get('admin_authenticated')?.value === 'true';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'id','customer','email','address','city','state','pincode',
      'totalMrp','totalPrice','shippingFee','status','paymentId','paymentMethod','createdAt'
    ];
    const rows = orders.map(o => ({
      id: o.id,
      customer: o.customer,
      email: o.email || '',
      address: o.address,
      city: o.city,
      state: o.state || '',
      pincode: o.pincode,
      totalMrp: o.totalMrp,
      totalPrice: o.totalPrice,
      shippingFee: o.shippingFee ?? 0,
      status: o.status,
      paymentId: o.paymentId || '',
      paymentMethod: o.paymentMethod || '',
      createdAt: o.createdAt.toISOString()
    }));

    const csv = toCsv(rows, headers);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv"`
      }
    });
  } catch (e) {
    console.error('Export orders error:', e);
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 });
  }
}