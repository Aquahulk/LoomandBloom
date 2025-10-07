import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const devAutoConfirm = process.env.PAYMENTS_DEV_AUTO_CONFIRM === '1';
    if (!secret && !devAutoConfirm) {
      console.error('Razorpay secret not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const body = await req.json();
    const { orderId, paymentId, signature } = body || {};
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expectedSignature = secret
      ? crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
      : '';

    if (expectedSignature !== signature && !devAutoConfirm) {
      console.error('Invalid payment signature for booking');
      await prisma.serviceBooking.updateMany({
        where: { paymentId: orderId },
        data: { status: 'CANCELLED' }
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Find booking by stored Razorpay order id in paymentId field
    const booking = await prisma.serviceBooking.findFirst({
      where: { paymentId: orderId },
      include: { service: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found for order' }, { status: 404 });
    }

    // Confirm atomically only if no other booking is CONFIRMED for this slot
    const amountPaise = Math.max(0, Math.floor((booking.service?.priceMin || 0) * 100));
    const confirmed = await prisma.$transaction(async (tx) => {
      const conflict = await tx.serviceBooking.findFirst({
        where: {
          id: { not: booking.id },
          serviceId: booking.serviceId,
          date: booking.date,
          startMinutes: booking.startMinutes,
          status: 'CONFIRMED'
        }
      });
      if (conflict) {
        // Cancel this booking to free the slot
        await tx.serviceBooking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
        return null;
      }
      return tx.serviceBooking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED', amountPaid: amountPaise }
      });
    });

    if (!confirmed) {
      return NextResponse.json({ error: 'Slot already taken' }, { status: 409 });
    }

    // Create an Order record so bookings appear in Admin Orders
    try {
      const address = [
        confirmed.addressLine1 || '',
        confirmed.addressLine2 || ''
      ].filter(Boolean).join(', ');

      const session = getSessionFromRequest(req);
      // Prefer logged-in session email so the order shows in My Orders
      const orderEmail = session?.email || confirmed.customerEmail || undefined;
      const orderCustomer = session?.name || confirmed.customerName || 'Service Booking';

      await prisma.order.create({
        data: {
          customer: orderCustomer,
          email: orderEmail,
          phone: confirmed.customerPhone || undefined,
          address: address || '',
          city: confirmed.city || '',
          state: confirmed.state || undefined,
          pincode: confirmed.postalCode || '',
          // Store amounts in paise to match UI formatting helpers
          totalMrp: amountPaise,
          totalPrice: amountPaise,
          shippingFee: 0,
          status: 'PAID' as any,
          paymentId: paymentId,
          paymentMethod: 'Razorpay',
          // Store structured details so UI can show service info reliably
          paymentDetails: JSON.stringify({
            type: 'service',
            serviceName: booking.service?.name || '',
            date: confirmed.date,
            startMinutes: confirmed.startMinutes,
            bookingId: confirmed.id
          })
        }
      });
    } catch (orderErr) {
      console.error('Failed to create order for booking:', orderErr);
      // Do not fail verification if order creation fails; booking is confirmed
    }

    return NextResponse.json({ success: true, booking: confirmed });
  } catch (error: any) {
    console.error('Booking payment verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}