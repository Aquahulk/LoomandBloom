export const dynamic = 'force-dynamic';
import { prisma } from '@/app/lib/prisma';
import DeleteOrderButton from './DeleteOrderButton';
import { formatINR, paiseToRupees } from '@/app/lib/currency';
import { formatDateIST } from '@/app/lib/date';

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          variant: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Helper to determine if an Order represents a service booking (no items, service details in paymentDetails)
  const isServiceOrder = (order: any) => {
    if (order.items.length === 0 && order.paymentDetails) {
      try {
        const info = JSON.parse(order.paymentDetails as any);
        if (info?.type === 'service') return true;
      } catch {}
      const details = (order as any).paymentDetails as string;
      if (typeof details === 'string' && details.startsWith('Service:')) return true;
    }
    return false;
  };

  // Show only product orders in this view; service bookings belong to the Bookings tab
  const productOrders = orders.filter((o) => !isServiceOrder(o));

  // Prefetch bookings mapped by paymentId for legacy orders that don't include bookingId in paymentDetails
  const servicePaymentIds = orders
    .filter(o => o.items.length === 0 && !!o.paymentDetails)
    .map(o => o.paymentId)
    .filter(Boolean) as string[];
  const relatedBookings = await prisma.serviceBooking.findMany({
    where: { paymentId: { in: servicePaymentIds } },
    select: { id: true, paymentId: true }
  });
  const bookingByPaymentId = Object.fromEntries(relatedBookings.map(b => [b.paymentId, b]));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'PENDING':
        return 'PAID';
      case 'PAID':
        return 'SHIPPED';
      case 'SHIPPED':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600">Manage customer orders and track fulfillment</p>
        <div className="mt-4 flex items-center gap-3">
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

      {/* Top Tabs: Orders | Bookings */}
      <div className="border-b">
        <nav className="flex gap-4 px-1">
          <a href="/admin/orders" className="px-3 py-2 text-sm font-medium border-b-2 border-green-600 text-green-700">Orders</a>
          <a href="/admin/bookings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Bookings</a>
        </nav>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id.slice(-8)}
                      </div>
                      {order.paymentId && (
                        <div className="text-sm text-gray-500">
                          Payment: {order.paymentId.slice(-8)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customer}</div>
                      {order.email && (
                        <div className="text-sm text-gray-500">{order.email}</div>
                      )}
                      {order.phone && (
                        <div className="text-sm text-gray-500">{order.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        if (order.items.length === 0 && order.paymentDetails) {
                          try {
                            const info = JSON.parse(order.paymentDetails as any);
                            if (info?.type === 'service') return 'Service';
                          } catch {}
                          if ((order as any).paymentDetails?.startsWith('Service:')) return 'Service';
                        }
                        return 'Product';
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {order.items.length === 0 && order.paymentDetails ? (
                      (() => {
                        try {
                          const info = JSON.parse(order.paymentDetails as any);
                          if (info?.type === 'service') {
                            const hh = Math.floor((info.startMinutes || 0) / 60);
                            const mm = String((info.startMinutes || 0) % 60).padStart(2, '0');
                            const bookingId = info.bookingId || bookingByPaymentId[order.paymentId || '']?.id || '';
                            return (
                              <div className="space-y-1 text-sm text-gray-900">
                                <div className="font-medium">{info.serviceName || 'Service Booking'}</div>
                                <div className="text-gray-700">Date: {info.date}</div>
                                <div className="text-gray-700">Start: {hh}:{mm}</div>
                                {bookingId && (
                                  <a href={`/admin/bookings/${bookingId}`} className="text-blue-600 hover:underline">View booking</a>
                                )}
                              </div>
                            );
                          }
                        } catch {}
                        // Fallback for legacy string format
                        const details = (order as any).paymentDetails as string;
                        if (typeof details === 'string' && details.startsWith('Service:')) {
                          const parts = details.split('|').map(s => s.trim());
                          const namePart = parts.find(p => p.startsWith('Service:')) || '';
                          const datePart = parts.find(p => p.startsWith('Date:')) || '';
                          const startPart = parts.find(p => p.startsWith('Start:')) || '';
                          const serviceName = namePart.replace('Service:', '').trim();
                          const date = datePart.replace('Date:', '').trim();
                          const startMinutes = Number((startPart.replace('Start:', '').trim())) || 0;
                          const hh = Math.floor(startMinutes / 60);
                          const mm = String(startMinutes % 60).padStart(2, '0');
                          const bookingId = bookingByPaymentId[order.paymentId || '']?.id || '';
                          return (
                            <div className="space-y-1 text-sm text-gray-900">
                              <div className="font-medium">{serviceName || 'Service Booking'}</div>
                              <div className="text-gray-700">Date: {date}</div>
                              <div className="text-gray-700">Start: {hh}:{mm}</div>
                              {bookingId && (
                                <a href={`/admin/bookings/${bookingId}`} className="text-blue-600 hover:underline">View booking</a>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div className="text-sm text-gray-900">Service Booking</div>
                        );
                      })()
                    ) : (
                      <>
                        <div className="text-sm text-gray-900">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.slice(0, 2).map(item => item.product.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatINR(paiseToRupees(order.totalPrice))}
                    </div>
                    {order.totalMrp > order.totalPrice && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatINR(paiseToRupees(order.totalMrp))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateIST(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <a href={`/admin/orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
                        View
                      </a>
                      {getNextStatus(order.status) && (
                        <form action={`/api/admin/orders/update-status?orderId=${order.id}&status=${getNextStatus(order.status)}`} method="POST">
                          <button type="submit" className="text-green-600 hover:text-green-900">
                            Mark as {getNextStatus(order.status)}
                          </button>
                        </form>
                      )}
                      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                        <form action={`/api/admin/orders/update-status?orderId=${order.id}&status=CANCELLED`} method="POST">
                          <button type="submit" className="text-red-600 hover:text-red-900">
                            Cancel
                          </button>
                        </form>
                      )}
                      <DeleteOrderButton id={order.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {productOrders.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15v-4h4v4H8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
          <p className="mt-1 text-sm text-gray-500">Orders will appear here when customers make purchases.</p>
        </div>
      )}
    </div>
  );
}
