import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadImage } from '@/app/lib/cloudinary-server';

// Cloudinary configuration is handled in cloudinary-server.ts

export async function POST(req: NextRequest) {
  try {
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

    // Debug logging
    console.log('Product creation data:', {
      name,
      description,
      price,
      mrp,
      sku,
      stock,
      categoryId
    });

    // Validate required fields
    if (!name || !description || !price || isNaN(price) || !sku || !stock || isNaN(stock) || !categoryId) {
      console.log('Validation failed - missing fields:', {
        name: !!name,
        description: !!description,
        price: price,
        priceValid: !isNaN(price),
        sku: !!sku,
        stock: stock,
        stockValid: !isNaN(stock),
        categoryId: !!categoryId
      });
      return NextResponse.json(
        { error: 'All required fields must be provided and valid' },
        { status: 400 }
      );
    }

    // Find or create category
    let category;
    try {
      console.log('Looking for category with slug:', categoryId);
      category = await prisma.category.findUnique({
        where: { slug: categoryId }
      });

      if (!category) {
        console.log('Category not found, creating new one...');
        // Create category if it doesn't exist
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
        console.log('Created category:', category);
      } else {
        console.log('Found existing category:', category);
      }
    } catch (error) {
      console.error('Error handling category:', error);
      return NextResponse.json(
        { error: 'Invalid category selected' },
        { status: 400 }
      );
    }

    // Check if SKU already exists
    console.log('Checking for existing SKU:', sku);
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      console.log('SKU already exists:', existingProduct);
      return NextResponse.json(
        { error: 'SKU already exists. Please use a different SKU.' },
        { status: 400 }
      );
    }
    console.log('SKU is unique, proceeding...');

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingSlug = await prisma.product.findUnique({
      where: { slug }
    });

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Upload images to Cloudinary
    const uploadedImages = [];
    const imageFiles = [];
    
    // Collect all image files
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value);
      }
    }

    // Upload images to Cloudinary
    console.log('Uploading images, count:', imageFiles.length);
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
    console.log('Image upload completed, uploaded:', uploadedImages.length);

    // Create product in database
    console.log('Creating product in database with data:', {
      name,
      slug: finalSlug,
      description,
      price,
      mrp,
      sku,
      stock,
      categoryId: category.id,
      imageCount: uploadedImages.length
    });
    
    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        price,
        mrp,
        sku,
        stock,
        categoryId: category.id,
        images: {
          create: uploadedImages
        }
      },
      include: {
        category: true,
        images: true
      }
    });
    
    console.log('Product created successfully:', product.id);

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        stock: product.stock,
        category: product.category.name,
        images: product.images.length
      }
    });

  } catch (error: any) {
    console.error('Error creating product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    return NextResponse.json(
      { 
        error: 'Failed to create product. Please try again.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: true,
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
