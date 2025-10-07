import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import { buildCloudinaryUrl, getPlaceholderImage } from '@/app/lib/cloudinary';

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const services = await prisma.service.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      <p className="text-gray-600 mb-6">Select a service to book a 2-hour timeslot (9:00 AM – 9:00 PM).</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s => (
          <div key={s.id} className="bg-white border rounded-lg shadow overflow-hidden">
            <Link href={`/${locale}/services/${s.slug}`} className="block">
              <div className="aspect-[4/3] bg-gray-100">
                {// eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imagePublicId ? buildCloudinaryUrl(s.imagePublicId, 800) : getPlaceholderImage(800, 600, s.name)}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />}
              </div>
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-lg text-gray-900">{s.name}</h2>
                <p className="text-sm text-gray-600 line-clamp-3">{s.description}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-gray-700 text-sm">Starting at ₹{s.priceMin}</div>
                  <span className="text-green-700 hover:underline">Book Timeslot →</span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}


