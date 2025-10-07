import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, priceMin, imagePublicId } = body || {};
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (priceMin !== undefined) data.priceMin = priceMin;
    if (imagePublicId !== undefined) data.imagePublicId = imagePublicId;

    const service = await prisma.service.update({ where: { id }, data });
    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error('Admin update service error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const _count = await prisma.serviceBooking.count({ where: { serviceId: id, status: { not: 'CANCELLED' } } });
    if (_count > 0) {
      return NextResponse.json({ error: 'Cannot delete service with active bookings' }, { status: 400 });
    }
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete service error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}