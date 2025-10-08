import { prisma } from '@/app/lib/prisma';
import BookingWidget from './BookingWidget';
import HoldBanner from '@/app/components/HoldBanner';

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug } });

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="text-xl font-semibold">This service is currently unavailable.</div>
        <p className="text-gray-700">Our garden services are still available — please explore other services.</p>
        <a href={`/${(await params).locale}/services`} className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">View All Services</a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <HoldBanner />
      <div>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <p className="text-gray-700 mt-2">{service.description}</p>
      </div>
      <div className="bg-white border rounded-lg shadow p-4">
        <BookingWidget serviceSlug={service.slug} />
      </div>
    </div>
  );
}
