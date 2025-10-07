import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/app/lib/cloudinary-server';
import { prisma } from '@/app/lib/prisma';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Collect all image files (support both image_* and single 'file')
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && (key.startsWith('image_') || key === 'file')) {
        imageFiles.push(value);
      }
    }

    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    const uploadedImages: { publicId: string; url: string; originalName: string }[] = [];
    const title = (formData.get('title') as string) || null;
    const description = (formData.get('description') as string) || null;
    const type = ((formData.get('type') as string) || 'OTHER') as any;
    const categoryId = (formData.get('categoryId') as string) || null;
    const locale = (formData.get('locale') as string) || null;

    // Upload each image to Cloudinary
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      try {
        const result = await uploadImage(file, 'bharat-pushpam/uploaded') as any;

        const img = {
          publicId: result.public_id,
          url: result.secure_url,
          originalName: file.name
        };
        uploadedImages.push(img);

        // Also create DisplayAsset so it shows up in admin listing
        try {
          await prisma.displayAsset.create({
            data: {
              title: title || undefined,
              description: description || undefined,
              type,
              publicId: img.publicId,
              url: img.url,
              order: 0,
              active: true,
              locale: locale || undefined,
              categoryId: categoryId || undefined
            }
          });
        } catch (dbErr) {
          console.error('Failed to create display asset:', dbErr);
        }

      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
        // Continue with other images even if one fails
      }
    }

    // Revalidate homepage caches so changes reflect immediately
    try {
      revalidateTag('home-data');
      const locales = ['en', 'hi', 'mr'];
      if (locale && locales.includes(locale)) {
        revalidatePath(`/${locale}`);
      } else {
        locales.forEach(loc => revalidatePath(`/${loc}`));
      }
    } catch (e) {
      console.warn('Revalidate after image upload failed:', e);
    }

    return NextResponse.json({
      success: true,
      uploaded: uploadedImages.length,
      images: uploadedImages
    });

  } catch (error: any) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
