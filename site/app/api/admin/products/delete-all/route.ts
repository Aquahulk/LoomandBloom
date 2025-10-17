import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { deleteImage } from '@/app/lib/cloudinary-server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    // Optional force flag to override order protection (defaults to false)
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    const products = await prisma.product.findMany({
      include: {
        images: true,
        _count: { select: { orderItems: true } },
      },
    });

    let deleted = 0;
    let skipped = 0;

    for (const p of products) {
      if (!force && p._count.orderItems > 0) {
        skipped++;
        continue;
      }

      // If forcing and there are order items, remove them first to avoid FK restriction
      if (force && p._count.orderItems > 0) {
        await prisma.orderItem.deleteMany({ where: { productId: p.id } });
      }

      // Best-effort Cloudinary cleanup
      for (const img of p.images) {
        if (img.publicId) {
          try {
            await deleteImage(img.publicId);
          } catch (e) {
            console.warn('Cloudinary delete failed for', img.publicId, e);
          }
        }
      }

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: p.id } }),
        prisma.variant.deleteMany({ where: { productId: p.id } }),
        prisma.review.deleteMany({ where: { productId: p.id } }),
        prisma.product.delete({ where: { id: p.id } }),
      ]);
      deleted++;
    }

    return NextResponse.json({ success: true, deleted, skipped, message: `Deleted ${deleted} products. Skipped ${skipped} with orders.` });
  } catch (error: any) {
    console.error('Bulk delete products error:', error);
    return NextResponse.json({ error: 'Failed to delete all products' }, { status: 500 });
  }
}