import Razorpay from 'razorpay';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const devAutoConfirm = process.env.PAYMENTS_DEV_AUTO_CONFIRM === '1';
    if ((!keyId || !keySecret) && !devAutoConfirm) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Load booking with service pricing
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: { service: true }
    });
    if (!booking || !booking.service) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Booking is cancelled' }, { status: 400 });
    }

    // If logged-in user is on hold, block payment initiation for booking
    try {
      const session = getSessionFromRequest(req);
      if (session) {
        const user = await prisma.user.findUnique({ where: { email: session.email } });
        if (user?.isOnHold) {
          return NextResponse.json({ error: 'Your account is on hold. Please contact support to lift the hold.' }, { status: 403 });
        }
      }
    } catch (_) {}

    // Amount in paise (₹)
    const amountPaise = Math.max(100, Math.floor((booking.service.priceMin || 0) * 100));
    const currency = 'INR';

    let razorpayOrder: { id: string; amount: number | string; currency: string };
    if (devAutoConfirm && (!keyId || !keySecret)) {
      razorpayOrder = {
        id: `dev_order_${booking.id}`,
        amount: amountPaise,
        currency
      };
    } else {
      const instance = new Razorpay({ key_id: keyId!, key_secret: keySecret! });
      // Create Razorpay order with booking notes
      razorpayOrder = await instance.orders.create({
        amount: amountPaise,
        currency,
        receipt: `booking_${booking.id}`,
        notes: {
          bookingId: booking.id,
          customerName: booking.customerName || '',
          customerPhone: booking.customerPhone || '',
          customerEmail: booking.customerEmail || ''
        }
      });
    }

    // Store Razorpay order id against booking for verification
    await prisma.serviceBooking.update({
      where: { id: booking.id },
      data: { paymentId: razorpayOrder.id }
    });

    return NextResponse.json({ order: razorpayOrder, bookingId: booking.id });
  } catch (error: any) {
    console.error('Booking order creation error:', error);
    return NextResponse.json({ error: 'Failed to create booking order' }, { status: 500 });
  }
}