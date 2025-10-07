import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';
import { getSettings } from '@/app/lib/settings';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
  const settings = await getSettings();
  if (settings.maintenanceMode) {
    return NextResponse.json({ error: 'Bookings are temporarily disabled' }, { status: 503 });
  }
  const { slug } = await params;
  const body = await req.json();
  const { date, startMinutes, customerName, customerPhone, customerEmail, notes,
    addressLine1, addressLine2, city, state, postalCode } = body || {};

  if (!date || typeof startMinutes !== 'number' || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Prevent booking past-time slots (based on local time)
  const start = new Date(`${date}T00:00:00`);
  start.setMinutes(start.getMinutes() + startMinutes);
  if (start.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Cannot book a past time slot' }, { status: 400 });
  }

    // Ensure service exists
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // If logged-in user is on hold, block booking
    try {
      const session = getSessionFromRequest(req);
      if (session) {
        const user = await prisma.user.findUnique({ where: { email: session.email } });
        if (user?.isOnHold) {
          return NextResponse.json({ error: 'Your account is on hold. Please contact support to lift the hold.' }, { status: 403 });
        }
      }
    } catch (_) {}

    // Enforce booking rules from settings
    // 1) Blackout dates
    if (Array.isArray(settings.bookings.blackoutDates) && settings.bookings.blackoutDates.includes(date)) {
      return NextResponse.json({ error: 'Bookings are not available on selected date' }, { status: 400 });
    }
    // 2) Max days in advance
    const today = new Date();
    const selected = new Date(`${date}T00:00:00`);
    const diffDays = Math.ceil((selected.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays > settings.bookings.bookingMaxDaysAdvance) {
      return NextResponse.json({ error: `Bookings allowed only up to ${settings.bookings.bookingMaxDaysAdvance} days in advance` }, { status: 400 });
    }
    // 3) Same-day cutoff
    const midnight = new Date(`${date}T00:00:00`).getTime();
    const cutoff = midnight + settings.bookings.sameDayCutoffMinutes * 60 * 1000;
    if (selected.toDateString() === today.toDateString() && Date.now() > cutoff) {
      return NextResponse.json({ error: 'Same-day booking cutoff has passed' }, { status: 400 });
    }
    // 4) Capacity per slot
    const confirmedCount = await prisma.serviceBooking.count({
      where: { serviceId: service.id, date, startMinutes, status: 'CONFIRMED' }
    });
    if (confirmedCount >= settings.bookings.capacityPerSlot) {
      return NextResponse.json({ error: 'Selected slot is full' }, { status: 409 });
    }

    const booking = await prisma.serviceBooking.create({
      data: {
        serviceId: service.id,
        date,
        startMinutes,
        durationMinutes: 120,
        customerName,
        customerPhone,
        customerEmail,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        notes,
        status: 'PENDING'
      }
    });
    // Redirect to payment checkout
    const paymentUrl = `/pay/booking/${booking.id}`;
    return NextResponse.json({ success: true, booking, paymentUrl });
  } catch (error: any) {
    console.error('Error in booking endpoint:', error);
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 });
  }
}