import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSessionFromRequest } from '@/app/lib/auth';
import { getSettings } from '@/app/lib/settings';
import { validatePincode, isPincodeAllowed } from '@/app/lib/security';

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
  const settings = await getSettings();
  if (settings.maintenanceMode) {
    return NextResponse.json({ error: 'Bookings are temporarily disabled' }, { status: 503 });
  }
  // Require authenticated user session for creating a booking
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Please login to book a service' }, { status: 401 });
  }
  const { slug } = await params;
  const body = await req.json();
  const { date, startMinutes, customerName, customerPhone, customerEmail, notes,
    addressLine1, addressLine2, city, state, postalCode } = body || {};

  if (!date || typeof startMinutes !== 'number' || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  // Address compulsory for service bookings
  if (!addressLine1 || !city || !postalCode) {
    return NextResponse.json({ error: 'Address line 1, city and pincode are required' }, { status: 400 });
  }
  const pin = (postalCode || '').toString().trim();
  if (!validatePincode(pin)) {
    return NextResponse.json({ error: 'Please enter a valid 6-digit pincode' }, { status: 400 });
  }
  const allowedPrefixes = (settings.bookings?.serviceAllowedPincodes && settings.bookings.serviceAllowedPincodes.length > 0)
    ? settings.bookings.serviceAllowedPincodes
    : ((settings.checkout as any)?.allowedPincodePrefixes || []);
  if (!isPincodeAllowed(pin, allowedPrefixes)) {
    return NextResponse.json({ error: 'We currently serve only within Pune (Maharashtra) district pincodes.' }, { status: 400 });
  }

  // Prevent booking past-time slots using India timezone
  const INDIA_TZ = 'Asia/Kolkata';
  function getIndiaToday(): string { return new Date().toLocaleDateString('en-CA', { timeZone: INDIA_TZ }); }
  function getIndiaNowMinutes(): number {
    const hm = new Intl.DateTimeFormat('en-GB', { timeZone: INDIA_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const [h, m] = hm.split(':').map(n => parseInt(n, 10));
    return h * 60 + m;
  }
  const indiaToday = getIndiaToday();
  const indiaNowMinutes = getIndiaNowMinutes();
  if (date < indiaToday) {
    return NextResponse.json({ error: 'Cannot book a past date' }, { status: 400 });
  }
  if (date === indiaToday && startMinutes <= indiaNowMinutes) {
    return NextResponse.json({ error: 'Cannot book a past time slot' }, { status: 400 });
  }

    // Ensure service exists
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // If logged-in user is on hold, block booking
    try {
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
    // Max days in advance based on India date difference
    const today = indiaToday;
    const diffDays = (() => {
      const [ty, tm, td] = today.split('-').map(n => parseInt(n, 10));
      const [sy, sm, sd] = (date as string).split('-').map(n => parseInt(n, 10));
      const t = new Date(ty, tm - 1, td);
      const s = new Date(sy, sm - 1, sd);
      return Math.ceil((s.getTime() - t.getTime()) / (24 * 60 * 60 * 1000));
    })();
    if (diffDays > settings.bookings.bookingMaxDaysAdvance) {
      return NextResponse.json({ error: `Bookings allowed only up to ${settings.bookings.bookingMaxDaysAdvance} days in advance` }, { status: 400 });
    }
    // 3) Same-day cutoff based on India time
    if (date === indiaToday && indiaNowMinutes > settings.bookings.sameDayCutoffMinutes) {
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