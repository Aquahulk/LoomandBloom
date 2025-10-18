import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadImage } from '@/app/lib/cloudinary-server';
import { deleteImage } from '@/app/lib/cloudinary-server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product
    });

  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleUpdate(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleUpdate(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        _count: { select: { orderItems: true } }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product._count.orderItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a product that has existing orders.' },
        { status: 400 }
      );
    }

    for (const img of product.images) {
      if (img.publicId) {
        try {
          await deleteImage(img.publicId);
        } catch (e) {
          console.warn('Cloudinary deletion failed for', img.publicId, e);
        }
      }
    }

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: product.id } }),
      prisma.variant.deleteMany({ where: { productId: product.id } }),
      prisma.review.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { id: product.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

async function handleUpdate(
  req: NextRequest,
  params: Promise<{ slug: string }>
) {
  try {
    console.log('API route called with method:', req.method);
    const { slug } = await params;
    console.log('Updating product with slug:', slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Product slug is required' },
        { status: 400 }
      );
    }

    // Find the product by slug first
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    
    // Extract form data
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseInt(formData.get('price') as string) * 100; // Convert to paise
    const mrpValue = parseInt(formData.get('mrp') as string);
    const mrp = (mrpValue && !isNaN(mrpValue)) ? mrpValue * 100 : price;
    const sku = formData.get('sku') as string;
    const stock = parseInt(formData.get('stock') as string);
    const categoryId = formData.get('categoryId') as string;

    // Validate required fields (allow stock=0)
    if (!name || !description || !price || isNaN(price) || !sku || isNaN(stock) || stock < 0 || !categoryId) {
      return NextResponse.json(
        { error: 'All required fields must be provided and valid' },
        { status: 400 }
      );
    }

    // Find or create category
    let category;
    try {
      category = await prisma.category.findUnique({
        where: { slug: categoryId }
      });

      if (!category) {
        const categoryName = categoryId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: categoryId,
            description: `${categoryName} category for Bharat Pushpam`
          }
        });
      }
    } catch (error) {
      console.error('Error handling category:', error);
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }

    // Check if SKU already exists (excluding current product)
    const existingSku = await prisma.product.findFirst({
      where: { 
        sku,
        id: { not: existingProduct.id }
      }
    });

    if (existingSku) {
      return NextResponse.json(
        { error: 'SKU already exists. Please use a different SKU.' },
        { status: 400 }
      );
    }

    // Generate new slug from name
    const newSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if new slug already exists (excluding current product)
    const existingSlug = await prisma.product.findFirst({
      where: { 
        slug: newSlug,
        id: { not: existingProduct.id }
      }
    });

    let finalSlug = newSlug;
    if (existingSlug) {
      finalSlug = `${newSlug}-${Date.now()}`;
    }

    // Collect new image files
    const imageFiles = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    // Upload new images to Cloudinary
    const uploadedImages = [];
    if (imageFiles.length > 0) {
      console.log('Uploading new images, count:', imageFiles.length);
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        console.log(`Uploading image ${i + 1}:`, file.name);

        try {
          const result = await uploadImage(file, 'bharat-pushpam/products') as any;
          console.log(`Image ${i + 1} uploaded successfully:`, result.public_id);

          uploadedImages.push({
            publicId: result.public_id,
            alt: `${name} - Image ${i + 1}`,
            position: i
          });
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
          // Continue with other images even if one fails
        }
      }
    }

    // Update product in database
    const product = await prisma.product.update({
      where: { id: existingProduct.id },
      data: {
        name,
        slug: finalSlug,
        description,
        price,
        mrp,
        sku,
        stock,
        categoryId: category.id,
        ...(uploadedImages.length > 0 && {
          images: {
            create: uploadedImages
          }
        })
      },
      include: {
        category: true,
        images: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    });

    console.log('Product updated successfully:', product.id);

    // Trigger cache revalidation so updates show on Vercel
    try {
      const locales = ['en', 'hi', 'mr'];
      const slugToRevalidate = product.slug;
      locales.forEach(loc => {
        revalidatePath(`/${loc}/products/${slugToRevalidate}`);
        revalidatePath(`/${loc}/products`);
        revalidatePath(`/${loc}`);
      });
      // Invalidate homepage cached data (uses 'home-data' tag)
      revalidateTag('home-data');
    } catch (e) {
      console.warn('Revalidation failed in product update:', e);
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category.name,
        images: product.images.length
      }
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    // Ensure we always return valid JSON
    try {
      return NextResponse.json(
        { 
          error: 'Failed to update product. Please try again.',
          details: error.message || 'Unknown error'
        },
        { status: 500 }
      );
    } catch (_) {
      // Fallback if JSON creation fails
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}
