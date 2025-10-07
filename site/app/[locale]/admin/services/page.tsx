import { prisma } from '@/app/lib/prisma';

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Services</h1>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Name</th>
            <th className="text-left p-2 border">Min Price</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id}>
              <td className="p-2 border">{s.name}</td>
              <td className="p-2 border">₹{s.priceMin}</td>
            </tr>
          ))}
          {services.length === 0 && (
            <tr>
              <td className="p-3 text-gray-500" colSpan={2}>No services yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


