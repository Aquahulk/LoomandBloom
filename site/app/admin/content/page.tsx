import { prisma } from '@/app/lib/prisma';
import Image from 'next/image';
import EditAssetRow from './editassetrow';
import { buildCloudinaryUrl } from '@/app/lib/cloudinary-server';
import React from 'react';

async function getData() {
  const [assets, categories] = await Promise.all([
    prisma.displayAsset.findMany({ orderBy: { order: 'asc' } }),
    prisma.displayCategory.findMany({ orderBy: { name: 'asc' } }),
  ]);
  const byType = {
    LOGO: assets.filter(a => a.type === 'LOGO'),
    HERO: assets.filter(a => a.type === 'HERO'),
    BANNER: assets.filter(a => a.type === 'BANNER'),
    PROMO: assets.filter(a => a.type === 'PROMO'),
  } as Record<string, typeof assets>;
  return { assets, categories, byType };
}

export default async function AdminContentPage() {
  const { byType } = await getData();
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Content</h1>
          <p className="text-gray-600">Choose logo, hero, and promos shown on the homepage.</p>
        </div>
        <a href="/admin/images" className="inline-flex items-center px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700">Manage Images</a>
      </div>

      {/* Legend */}
      <section className="bg-white border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Where each type appears</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <LegendItem type="LOGO" label="Header logo (site header)" />
          <LegendItem type="HERO" label="Homepage hero background" />
          <LegendItem type="BANNER" label="Homepage promotional card" />
          <LegendItem type="PROMO" label="Homepage promotional card" />
          <LegendItem type="OTHER" label="Not shown on homepage" />
        </div>
      </section>

      {/* Logo */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Logo</h2>
        <p className="text-sm text-gray-600">Upload type "LOGO" in Images, then set order. Lowest order is preferred.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {byType.LOGO.map(a => (
            <div key={a.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-32">
                <Image src={a.url || buildCloudinaryUrl(a.publicId)} alt={a.title || 'Logo'} fill className="object-contain p-3" />
              </div>
              <EditAssetRow asset={a} />
            </div>
          ))}
        </div>
      </section>

      {/* Hero Images */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Hero Images</h2>
        <p className="text-sm text-gray-600">Type "HERO". Lowest order per locale is shown.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {byType.HERO.map(a => (
            <div key={a.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-40">
                <Image src={a.url || buildCloudinaryUrl(a.publicId)} alt={a.title || 'Hero'} fill className="object-cover" />
              </div>
              <EditAssetRow asset={a} />
            </div>
          ))}
        </div>
      </section>

      {/* Promotional Banners & Offers */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Promos & Banners</h2>
        <p className="text-sm text-gray-600">Types "BANNER" or "PROMO". Top 3 by order per locale are shown on homepage.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...byType.BANNER, ...byType.PROMO].map(a => (
            <div key={a.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-32">
                <Image src={a.url || buildCloudinaryUrl(a.publicId)} alt={a.title || 'Promo'} fill className="object-cover" />
              </div>
              <EditAssetRow asset={a} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LegendItem({ type, label }: { type: string; label: string }) {
  const cls = getTypeStyles(type);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded border ${cls}`}>{type}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

function getTypeStyles(type?: string) {
  switch (type) {
    case 'LOGO':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'HERO':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'BANNER':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'PROMO':
      return 'bg-pink-50 text-pink-700 border-pink-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}