import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authenticated')?.value === 'true';
}

// Permanently delete a booking (admin-only). This removes the booking record
// and frees up the slot immediately. Any related order records are preserved.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.serviceBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.serviceBooking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete booking error:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}