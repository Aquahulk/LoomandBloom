import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Validate environment
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('Razorpay secret not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    // Parse request body
    const body = await req.json();
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify signature
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const isValid = expectedSignature === signature;

    if (!isValid) {
      console.error('Invalid payment signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Find order by Razorpay order ID (stored in paymentId field)
    const order = await prisma.order.findFirst({
      where: { paymentId: orderId }
    });

    if (!order) {
      console.error(`Order not found with Razorpay order ID: ${orderId}`);
      return NextResponse.json({ 
        success: false,
        error: `Order not found: ${orderId}` 
      }, { status: 404 });
    }

    // Cross-check amount from Razorpay payment for consistency
    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });
      const payment = await instance.payments.fetch(paymentId);
      if (!payment || payment.order_id !== orderId) {
        return NextResponse.json({ success: false, error: 'Payment/order mismatch' }, { status: 400 });
      }
      if (typeof payment.amount !== 'number' || payment.amount !== order.totalPrice) {
        return NextResponse.json({ success: false, error: 'Amount mismatch' }, { status: 400 });
      }
    } catch (amtErr) {
      console.error('Amount verification error:', amtErr);
      return NextResponse.json({ success: false, error: 'Amount verification failed' }, { status: 500 });
    }

    // Update order status in database after validation
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paymentId: paymentId,
        updatedAt: new Date()
      }
    });

    console.log(`Payment verified: Order ${orderId}, Payment ID: ${paymentId}`);

    return NextResponse.json({ 
      success: true,
      message: 'Payment verified successfully'
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Payment verification failed' 
    }, { status: 500 });
  }
}