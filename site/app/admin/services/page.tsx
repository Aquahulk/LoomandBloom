import { prisma } from '@/app/lib/prisma';
import AdminServicesManager from './AdminServicesManager';

export default async function AdminServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Services</h1>
      <p className="text-gray-700">Create, edit, and delete services. These appear on the public Services page.</p>
      <AdminServicesManager initialServices={services} />
    </div>
  );
}