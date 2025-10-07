import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    // Verify user session
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Please login to cancel your order' }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    const locale = url.searchParams.get('locale') || 'en';

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.email !== session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow cancellation for PENDING or PAID orders
    if (order.status !== 'PENDING' && order.status !== 'PAID') {
      return NextResponse.json({ 
        error: 'This order cannot be cancelled as it has already been shipped or delivered' 
      }, { status: 400 });
    }

    // If payment was captured, attempt refund; else just cancel
    if (order.status === 'PAID') {
      try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (keyId && keySecret && order.paymentId) {
          const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
          // Initiate refund for the full amount
          // totalPrice is stored in paise
          await instance.payments.refund(order.paymentId, {
            amount: order.totalPrice,
            notes: { orderId: order.id }
          } as any);

          // Mark as refunded
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'REFUNDED' as any,
              updatedAt: new Date()
            }
          });
        } else {
          // Credentials missing or no paymentId; mark as refund requested for admin
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'REFUND_REQUESTED' as any,
              updatedAt: new Date()
            }
          });
        }
      } catch (refundErr) {
        console.error('Refund initiation failed:', refundErr);
        // Fall back to refund requested so admin can process
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'REFUND_REQUESTED' as any,
            updatedAt: new Date()
          }
        });
      }
    } else {
      // Pending payment - direct cancel
      await prisma.order.update({
        where: { id: orderId },
        data: { 
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });
    }

    // Redirect back to orders page
    return NextResponse.redirect(new URL(`/${locale}/account/orders`, req.url));
  } catch (error: any) {
    console.error('Order cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}