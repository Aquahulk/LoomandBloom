import { prisma } from '@/app/lib/prisma';

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <div className="mt-3 flex items-center gap-3">
          <a
            href="/api/admin/export/orders"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Orders (Excel/CSV)
          </a>
          <a
            href="/api/admin/export/orders"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Sheet in New Tab
          </a>
        </div>
      </div>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border">Order</th>
            <th className="text-left p-2 border">Customer</th>
            <th className="text-left p-2 border">Total</th>
            <th className="text-left p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td className="p-2 border">{o.id.slice(0,8)}</td>
              <td className="p-2 border">{o.customer}</td>
              <td className="p-2 border">₹{o.totalPrice}</td>
              <td className="p-2 border">{o.status}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td className="p-3 text-gray-500" colSpan={4}>No orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


