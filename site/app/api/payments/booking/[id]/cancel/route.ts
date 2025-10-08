import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Mark a booking as CANCELLED when user dismisses Razorpay or payment fails
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { reason } = await req.json().catch(() => ({ reason: 'user_cancelled' }));

    // Only allow cancelling PENDING bookings; confirmed bookings are immutable here
    const booking = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'Booking already confirmed' }, { status: 400 });
    }
    if (booking.status === 'CANCELLED') {
      return NextResponse.json({ success: true, booking });
    }

    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        paymentId: null,
        notes: reason ? `cancel:${reason}` : booking.notes || null,
      }
    });
    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}