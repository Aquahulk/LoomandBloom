import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
  // Verify admin is logged in
  const adminCookie = request.cookies.get('admin_authenticated');
  if (!adminCookie || adminCookie.value !== 'true') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get order ID from request
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if order is eligible for refund (must be REFUND_REQUESTED)
    if (order.status !== 'REFUND_REQUESTED' as any) {
      return NextResponse.json({ 
        error: 'Only orders with refund requests can be refunded' 
      }, { status: 400 });
    }

    // Update order status to REFUNDED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' as any }
    });

    // Redirect back to orders page
    return NextResponse.redirect(new URL('/admin/orders', request.url));
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}