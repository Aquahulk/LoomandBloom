import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { deleteImage } from '@/app/lib/cloudinary-server';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    // Delete all products first to avoid FK restrictions on categories
    const products = await prisma.product.findMany({
      include: { images: true, _count: { select: { orderItems: true } } }
    });

    let deletedProducts = 0;
    let skippedProducts = 0;

    for (const p of products) {
      if (!force && p._count.orderItems > 0) {
        skippedProducts++;
        continue;
      }

      // If forcing and there are order items, remove them first to avoid FK restriction
      if (force && p._count.orderItems > 0) {
        await prisma.orderItem.deleteMany({ where: { productId: p.id } });
      }

      for (const img of p.images) {
        if (img.publicId) {
          try { await deleteImage(img.publicId); } catch (e) { console.warn('Cloudinary delete failed for', img.publicId, e); }
        }
      }

      await prisma.$transaction([
        prisma.productImage.deleteMany({ where: { productId: p.id } }),
        prisma.variant.deleteMany({ where: { productId: p.id } }),
        prisma.review.deleteMany({ where: { productId: p.id } }),
        prisma.product.delete({ where: { id: p.id } }),
      ]);
      deletedProducts++;
    }

    // Break parent-child relations to avoid FK restriction on delete
    await prisma.category.updateMany({ data: { parentId: null } });

    const { count: deletedCategories } = await prisma.category.deleteMany({});

    return NextResponse.json({ success: true, deletedCategories, deletedProducts, skippedProducts });
  } catch (error: any) {
    console.error('Bulk delete categories error:', error);
    return NextResponse.json({ error: 'Failed to delete all categories' }, { status: 500 });
  }
}