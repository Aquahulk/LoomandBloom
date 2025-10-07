import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Verify admin session
    const adminAuthenticated = req.cookies.get('admin_authenticated')?.value === 'true';
    if (!adminAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const status = url.searchParams.get('status');

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: status as any,
        updatedAt: new Date()
      }
    });

    // Redirect back to orders page
    return NextResponse.redirect(new URL('/admin/orders', req.url));
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}