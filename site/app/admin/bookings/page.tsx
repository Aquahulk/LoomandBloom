export const dynamic = 'force-dynamic';
import { prisma } from '@/app/lib/prisma';
import { formatDateTimeIST } from '@/app/lib/date';
import AdminBookingActions from './AdminBookingActions';

export default async function AdminBookingsPage() {
  const bookings = await prisma.serviceBooking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { service: true }
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin: Bookings</h1>
      <p className="text-gray-700">All service bookings with customer details and address.</p>
      {/* Top Tabs: Orders | Bookings */}
      <div className="border-b">
        <nav className="flex gap-4 px-1">
          <a href="/admin/orders" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Orders</a>
          <a href="/admin/bookings" className="px-3 py-2 text-sm font-medium border-b-2 border-green-600 text-green-700">Bookings</a>
        </nav>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookings.map(b => (
          <div key={b.id} className="bg-white border rounded shadow p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{b.service.name}</div>
              <span className={`text-xs px-2 py-1 rounded ${b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : b.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span>
            </div>
            <div className="text-sm text-gray-600">Booking ID: {b.id}</div>
            <div className="text-sm text-gray-600">Date: {b.date}</div>
            <div className="text-sm text-gray-600">Start: {Math.floor(b.startMinutes / 60)}:{String(b.startMinutes % 60).padStart(2, '0')}</div>
            <div className="text-sm text-gray-600">Customer: {b.customerName}</div>
            <div className="text-sm text-gray-600">Phone: {b.customerPhone}</div>
            <div className="text-sm text-gray-600">Address: {[b.addressLine1, b.addressLine2, b.city, b.state, b.postalCode].filter(Boolean).join(', ')}</div>
            <div className="text-sm text-gray-600">Payment ID: {b.paymentId || 'N/A'}</div>
            <div className="text-sm text-gray-600">Amount Paid: {b.amountPaid ? `₹${(b.amountPaid/100).toFixed(2)}` : '₹0.00'}</div>
            {b.customerEmail && <div className="text-sm text-gray-600">Email: {b.customerEmail}</div>}
            <div className="text-sm text-gray-600">Address: {[b.addressLine1, b.addressLine2, b.city, b.state, b.postalCode].filter(Boolean).join(', ')}</div>
            {b.notes && <div className="text-sm text-gray-600">Notes: {b.notes}</div>}
            <div className="text-xs text-gray-500">Created: {formatDateTimeIST(b.createdAt)}</div>
            <div className="pt-2 flex items-center justify-between">
              <a href={`/admin/bookings/${b.id}`} className="text-blue-600 hover:underline text-sm">View details →</a>
              <AdminBookingActions id={b.id} status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}