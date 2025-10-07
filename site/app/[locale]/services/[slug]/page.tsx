import { prisma } from '@/app/lib/prisma';
import BookingWidget from './BookingWidget';
import HoldBanner from '@/app/components/HoldBanner';

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;
  const service = await prisma.service.findUnique({ where: { slug } });

  if (!service) {
    return <div className="max-w-3xl mx-auto p-6">Service not found.</div>;
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
