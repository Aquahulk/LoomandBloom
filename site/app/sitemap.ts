import { MetadataRoute } from 'next';
import { prisma } from '@/app/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://bharatpushpam.com';
  const locales = ['en', 'hi', 'mr'];
  
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } })
  ]);

  const staticPages = [
    '',
    '/about',
    '/contact',
    '/services',
    '/products',
    '/search'
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  // Static pages for each locale
  locales.forEach(locale => {
    staticPages.forEach(page => {
      sitemap.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8
      });
    });
  });

  // Product pages
  products.forEach(product => {
    locales.forEach(locale => {
      sitemap.push({
        url: `${baseUrl}/${locale}/products/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7
      });
    });
  });

  // Category pages
  categories.forEach(category => {
    locales.forEach(locale => {
      sitemap.push({
        url: `${baseUrl}/${locale}/products?category=${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6
      });
    });
  });

  return sitemap;
}
