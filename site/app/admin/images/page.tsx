import { prisma } from '@/app/lib/prisma';
import { buildCloudinaryUrl } from '@/app/lib/cloudinary-server';
import Image from 'next/image';
import UploadForm from './UploadForm';
import DeleteButton from './DeleteButton';
import Link from 'next/link';

async function getData() {
  const [assets, categories] = await Promise.all([
    prisma.displayAsset.findMany({ orderBy: { order: 'asc' } }),
    prisma.displayCategory.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return { assets, categories };
}

export default async function AdminImages() {
  const { assets, categories } = await getData();
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Display Images & Banners</h1>
          <p className="text-gray-600">Manage homepage hero, banners, and promo images.</p>
        </div>
        <LinkButton />
      </div>

      {/* Legend explaining where each type shows on the site, with recommended sizes */}
      <section className="bg-white border rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Where each type appears</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <LegendItem type="LOGO" label="Header logo (site header)" />
          <LegendItem type="HERO" label="Homepage hero background" />
          <LegendItem type="BANNER" label="Homepage promotional card" />
          <LegendItem type="PROMO" label="Homepage promotional card" />
          <LegendItem type="FRESH_PLANT" label="Fresh Plants Boxes" />
          <LegendItem type="ABOUT_US" label="About Us Section" />
          <LegendItem type="OTHER" label="Not shown on homepage" />
        </div>
        <div className="mt-3 grid sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
          <SizeHint type="LOGO" />
          <SizeHint type="HERO" />
          <SizeHint type="BANNER" />
          <SizeHint type="PROMO" />
          <SizeHint type="FRESH_PLANT" />
          <SizeHint type="ABOUT_US" />
        </div>
      </section>

      <UploadForm categories={categories} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Existing Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assets.map(a => (
            <div key={a.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-40">
                <Image src={a.url || buildCloudinaryUrl(a.publicId)} alt={a.title || 'Asset'} fill className="object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{a.title || a.publicId}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getTypeStyles(a.type)}`}>{getPlacementLabel(a.type)}</span>
                      {a.locale ? <span className="text-xs px-2 py-0.5 rounded border bg-gray-50 text-gray-700 border-gray-200">{a.locale}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">{getRecommendedSize(a.type)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/admin/content" className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">Edit</Link>
                    <DeleteButton id={a.id} />
                  </div>
                </div>
                {a.description ? <p className="text-sm text-gray-700">{a.description}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LinkButton() {
  return (
    <a href="/" className="inline-flex items-center px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700">View site</a>
  );
}

// Client components are implemented in UploadForm.tsx and DeleteButton.tsx

function getPlacementLabel(type?: string) {
  switch (type) {
    case 'LOGO':
      return 'Header logo';
    case 'HERO':
      return 'Homepage hero';
    case 'BANNER':
      return 'Promo card';
    case 'PROMO':
      return 'Promo card';
    case 'FRESH_PLANT':
      return 'Fresh Plants box';
    case 'ABOUT_US':
      return 'About Us image';
    default:
      return 'Not on homepage';
  }
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

function LegendItem({ type, label }: { type: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded border ${getTypeStyles(type)}`}>{type}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}

function SizeHint({ type }: { type: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getTypeStyles(type)}`}>{type}</span>
      <span className="text-[12px] text-gray-600">{getRecommendedSize(type)}</span>
    </div>
  );
}

function getRecommendedSize(type?: string) {
  switch (type) {
    case 'LOGO':
      return 'Recommended: 400x120 (transparent PNG or SVG)';
    case 'HERO':
      return 'Recommended: 1920x800 (landscape, JPG/PNG)';
    case 'BANNER':
      return 'Recommended: 800x600 (4:3, JPG/PNG)';
    case 'PROMO':
      return 'Recommended: 800x600 (4:3, JPG/PNG)';
    case 'FRESH_PLANT':
      return 'Recommended: 600x450 (4:3, JPG/PNG)';
    case 'ABOUT_US':
      return 'Recommended: 800x600 (4:3, JPG/PNG)';
    default:
      return 'Recommended: 800x600 (JPG/PNG)';
  }
}
