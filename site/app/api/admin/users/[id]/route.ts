import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function isAdmin(req: NextRequest) {
  // Admin auth follows existing pattern using cookie flag
  return req.cookies.get('admin_authenticated')?.value === 'true';
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { isOnHold } = body as { isOnHold?: boolean };

    if (typeof isOnHold !== 'boolean') {
      return NextResponse.json({ error: 'isOnHold boolean is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isOnHold },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Load user to identify orders to anonymize
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Anonymize orders linked by email or phone
      await tx.order.updateMany({
        where: {
          OR: [
            { email: user.email },
            { phone: user.phone }
          ]
        },
        data: {
          customer: 'Deleted User',
          email: null,
          phone: null,
          paymentDetails: null
        }
      });

      // Delete the user; bookings keep but userId is set to NULL by FK rule
      await tx.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}