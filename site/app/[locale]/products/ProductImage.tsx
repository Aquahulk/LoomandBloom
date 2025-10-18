'use client';

import Image from 'next/image';
import { useState } from 'react';
import { buildCloudinaryUrl, getPlaceholderImage } from '@/app/lib/cloudinary';

interface ProductImageProps {
  images: Array<{ publicId: string; alt?: string | null }>;
  name: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  quality?: number;
}

export default function ProductImage({ 
  images, 
  name, 
  width = 600, 
  height = 600, 
  className = "object-cover",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  quality = 90
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  
  const [currentSrc, setCurrentSrc] = useState(() => {
    if (images.length > 0) {
      return buildCloudinaryUrl(images[0].publicId, width, height);
    }
    return getPlaceholderImage(width, height, name.split(' ')[0]);
  });

  // Allow disabling Next.js image optimization via env for diagnostics
  const unoptimizedFlag = process.env.NEXT_PUBLIC_IMAGE_UNOPTIMIZED === '1';

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setCurrentSrc(getPlaceholderImage(width, height, name.split(' ')[0]));
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={images[0]?.alt || name}
      fill
      className={className}
      sizes={sizes}
      quality={quality}
      unoptimized={unoptimizedFlag}
      onError={handleError}
    />
  );
}
