import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { deleteImage } from '@/app/lib/cloudinary-server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;

    // Load category with products and minimal relations needed
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          include: {
            images: true,
            _count: { select: { orderItems: true } },
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If there are products with existing orders, block deletion and report
    const blocking = category.products.filter(p => p._count.orderItems > 0);
    if (blocking.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category because some products have orders.',
          products: blocking.map(p => ({ slug: p.slug, sku: p.sku, orders: p._count.orderItems }))
        },
        { status: 400 }
      );
    }

    // Best-effort Cloudinary cleanup for all product images
    for (const p of category.products) {
      for (const img of p.images) {
        if (img.publicId) {
          try {
            await deleteImage(img.publicId);
          } catch (e) {
            console.warn('Cloudinary delete failed for', img.publicId, e);
          }
        }
      }
    }

    // Remove all products and their dependent data, then delete category
    await prisma.$transaction(async (tx) => {
      for (const p of category.products) {
        await tx.productImage.deleteMany({ where: { productId: p.id } });
        await tx.variant.deleteMany({ where: { productId: p.id } });
        await tx.review.deleteMany({ where: { productId: p.id } });
        await tx.product.delete({ where: { id: p.id } });
      }
      await tx.category.delete({ where: { id: categoryId } });
    });

    return NextResponse.json({ success: true, message: 'Category and its products deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
