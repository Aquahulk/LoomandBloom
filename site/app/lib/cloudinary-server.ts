// Server-side Cloudinary utilities
// This file should only be imported in server components and API routes

import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('[cloudinary-server] Missing env configuration:', {
    cloudName: !!cloudName,
    apiKey: !!apiKey,
    apiSecret: !!apiSecret
  });
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export async function uploadImage(file: File, folder = 'bharat-pushpam') {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Preserve original resolution on upload; optimize on delivery
          transformation: [
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Error processing file for upload:', error);
    throw error;
  }
}

export async function deleteImage(publicId: string) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export function buildCloudinaryUrl(publicId: string, width = 800, height?: number) {
  const transformation = height
    ? `c_fill,f_auto,q_auto:best,dpr_auto,e_sharpen:50,w_${width},h_${height}`
    : `c_fill,f_auto,q_auto:best,dpr_auto,e_sharpen:50,w_${width}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
}

export default cloudinary;
