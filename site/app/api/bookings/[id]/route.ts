import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: { service: true }
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, startMinutes, customerName, customerPhone, customerEmail, notes, status } = body || {};

  // Enforce reschedule only if more than 60 minutes remain before current start
  if (date || typeof startMinutes === 'number') {
    const existing = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const start = new Date(`${existing.date}T00:00:00`);
    start.setMinutes(start.getMinutes() + existing.startMinutes);
    const diffMs = start.getTime() - Date.now();
    if (diffMs < 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Rescheduling allowed only until 1 hour before start' }, { status: 400 });
    }

    // Also prevent rescheduling to a past time
    const nextDate = (date ?? existing.date) as string;
    const nextStartMinutes = (typeof startMinutes === 'number' ? startMinutes : existing.startMinutes) as number;
    const nextStart = new Date(`${nextDate}T00:00:00`);
    nextStart.setMinutes(nextStart.getMinutes() + nextStartMinutes);
    if (nextStart.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'Cannot reschedule to a past time slot' }, { status: 400 });
    }
  }

    const data: any = {};
    if (date) data.date = date;
    if (typeof startMinutes === 'number') data.startMinutes = startMinutes;
    if (customerName) data.customerName = customerName;
    if (customerPhone) data.customerPhone = customerPhone;
    if (customerEmail !== undefined) data.customerEmail = customerEmail;
    if (notes !== undefined) data.notes = notes;
    if (status && ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) data.status = status;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    try {
      // If changing date or start, ensure no CONFIRMED conflict exists
      if (data.date || typeof data.startMinutes === 'number') {
        const existing = await prisma.serviceBooking.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        const nextDate = (data.date ?? existing.date) as string;
        const nextStart = (typeof data.startMinutes === 'number' ? data.startMinutes : existing.startMinutes) as number;
        // Prevent setting to past time as part of conflict check block
        const nextStartTime = new Date(`${nextDate}T00:00:00`);
        nextStartTime.setMinutes(nextStartTime.getMinutes() + nextStart);
        if (nextStartTime.getTime() <= Date.now()) {
          return NextResponse.json({ error: 'Cannot choose a past time slot' }, { status: 400 });
        }
        const conflict = await prisma.serviceBooking.findFirst({
          where: {
            id: { not: id },
            serviceId: existing.serviceId,
            date: nextDate,
            startMinutes: nextStart,
            status: 'CONFIRMED'
          }
        });
        if (conflict) {
          return NextResponse.json({ error: 'Selected slot is already booked' }, { status: 409 });
        }
      }

      const booking = await prisma.serviceBooking.update({ where: { id }, data, include: { service: true } });
      return NextResponse.json({ success: true, booking });
    } catch (err: any) {
      console.error('Booking update error:', err);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const start = new Date(`${existing.date}T00:00:00`);
    start.setMinutes(start.getMinutes() + existing.startMinutes);
    const diffMs = start.getTime() - Date.now();
    if (diffMs < 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Cancellation allowed only until 1 hour before start' }, { status: 400 });
    }
    const booking = await prisma.serviceBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { service: true }
    });
    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
