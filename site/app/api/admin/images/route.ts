import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_: Request) {
  try {
    const images = await prisma.productImage.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { product: { name: 'asc' } },
        { position: 'asc' }
      ]
    });

    return NextResponse.json({ images });

  } catch (error: any) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
