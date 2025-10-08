import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Generate slot starts in minutes from midnight for 2-hour slots 9:00–21:00
function getSlotStarts() {
  return [540, 660, 780, 900, 1020, 1140];
}

function formatTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const mm = m.toString().padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    // Use NextRequest.nextUrl for reliability in dev and edge runtimes
    const dateParam = req.nextUrl.searchParams.get('date');

    // India timezone helpers
    const INDIA_TZ = 'Asia/Kolkata';
    function getIndiaToday(): string {
      return new Date().toLocaleDateString('en-CA', { timeZone: INDIA_TZ });
    }
    function getIndiaNowMinutes(): number {
      const hm = new Intl.DateTimeFormat('en-GB', { timeZone: INDIA_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
      const [h, m] = hm.split(':').map(n => parseInt(n, 10));
      return h * 60 + m;
    }

    // Normalize date to YYYY-MM-DD (supports DD-MM-YYYY input)
    const date = (() => {
      if (!dateParam) return null;
      const ddmmyyyy = dateParam.match(/^([0-3]\d)-([0-1]\d)-(\d{4})$/);
      if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${yyyy}-${mm}-${dd}`;
      }
      return dateParam; // assume YYYY-MM-DD
    })();

    // Debug logging to help diagnose date/slots issues in dev
    try {
      console.log('[slots]', { slug, dateParam, normalizedDate: date });
    } catch (_) {}

    if (!date) {
      const todayLocal = getIndiaToday();
      // Fallback to today if date is missing
      return NextResponse.json({ success: true, date: todayLocal, slots: getSlotStarts().map(start => ({
        startMinutes: start,
        label: `${formatTimeLabel(start)} - ${formatTimeLabel(start + 120)}`,
        // Do not mark past slots as booked here; booking API enforces past-time rule
        booked: false
      })) });
    }

    // Ensure service exists via slug
    const service = await prisma.service.findUnique({ where: { slug } });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const bookings = await prisma.serviceBooking.findMany({
      where: { serviceId: service.id, date },
      select: { startMinutes: true, status: true }
    });
    // Only CONFIRMED bookings block slots
    const bookedSet = new Set(bookings.filter(b => b.status === 'CONFIRMED').map(b => b.startMinutes));

    // Determine local "today" and current time to disable past slots
    const todayLocal = getIndiaToday(); // YYYY-MM-DD in India time
    const nowMinutes = getIndiaNowMinutes();

    const slots = getSlotStarts().map(start => ({
      startMinutes: start,
      label: `${formatTimeLabel(start)} - ${formatTimeLabel(start + 120)}`,
      // Only block slots that are actually CONFIRMED; past-time enforcement happens in booking API
      booked: bookedSet.has(start)
    }));

    try {
      console.log('[slots] response', { date, slotsCount: slots.length });
    } catch (_) {}
    return NextResponse.json({ success: true, date, slots });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    try {
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
    } catch (_) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch slots' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}