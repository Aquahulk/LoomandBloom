import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';

// Webhook event types
interface WebhookEvent {
  event: string;
  account_id: string;
  created_at: number;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        description: string;
        notes: Record<string, string>;
        created_at: number;
      };
    };
    order: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        receipt: string;
        notes: Record<string, string>;
        created_at: number;
      };
    };
  };
}

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

async function handlePaymentCaptured(event: WebhookEvent) {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes.orderId;

    if (!orderId) {
      console.error('No order ID found in payment notes');
      return;
    }

    // Update order status in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentId: payment.id
      }
    });

    // Log successful payment
    console.log(`Payment captured: Order ${orderId}, Amount: ₹${payment.amount/100}, Payment ID: ${payment.id}`);

    // TODO: Send confirmation email/SMS
    // TODO: Update inventory
    // TODO: Trigger fulfillment process

  } catch (error) {
    console.error('Error handling payment captured:', error);
    throw error;
  }
}

async function handlePaymentFailed(event: WebhookEvent) {
  try {
    const payment = event.payload.payment.entity;
    const orderId = payment.notes.orderId;

    if (!orderId) {
      console.error('No order ID found in payment notes');
      return;
    }

    // Update order status in database
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED'
      }
    });

    console.log(`Payment failed: Order ${orderId}, Payment ID: ${payment.id}`);

    // TODO: Send failure notification
    // TODO: Restore inventory

  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Validate environment
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('Razorpay webhook secret not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, secret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse webhook event
    let event: WebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Invalid webhook payload:', error);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Validate event structure
    if (!event.event || !event.payload) {
      console.error('Invalid webhook event structure');
      return NextResponse.json({ error: 'Invalid event structure' }, { status: 400 });
    }

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      
      case 'order.paid':
        // Handle order paid event
        console.log('Order paid event received:', event.payload.order.entity.id);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    
    // Return 200 to prevent Razorpay from retrying
    // Log the error for investigation
    return NextResponse.json({ error: 'Processing failed' }, { status: 200 });
  }
}


