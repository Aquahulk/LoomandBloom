import { prisma } from '@/app/lib/prisma';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

function formatTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const mm = m.toString().padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
}

export default async function AdminBookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.serviceBooking.findUnique({
    where: { id },
    include: { service: true }
  });

  if (!booking) {
    return <div className="max-w-4xl mx-auto p-6">Booking not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Top Tabs: Orders | Bookings */}
      <div className="border-b">
        <nav className="flex gap-4 px-1">
          <a href="/admin/orders" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Orders</a>
          <a href="/admin/bookings" className="px-3 py-2 text-sm font-medium border-b-2 border-green-600 text-green-700">Bookings</a>
        </nav>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <span className={`text-xs px-2 py-1 rounded ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{booking.status}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded shadow p-4 space-y-2">
          <div className="font-semibold">Service</div>
          <div className="text-sm text-gray-700">Name: {booking.service?.name}</div>
          <div className="text-sm text-gray-700">Description: {booking.service?.description}</div>
          <div className="text-sm text-gray-700">Starting Price: {formatINR(paiseToRupees(booking.service?.priceMin || 0))}</div>
        </div>

        <div className="bg-white border rounded shadow p-4 space-y-2">
          <div className="font-semibold">Booking</div>
          <div className="text-sm text-gray-700">ID: {booking.id}</div>
          <div className="text-sm text-gray-700">Date: {booking.date}</div>
          <div className="text-sm text-gray-700">Time: {formatTimeLabel(booking.startMinutes)} - {formatTimeLabel(booking.startMinutes + booking.durationMinutes)}</div>
          <div className="text-sm text-gray-700">Created: {new Date(booking.createdAt).toLocaleString()}</div>
          <div className="text-sm text-gray-700">Amount Paid: {formatINR(paiseToRupees(booking.amountPaid || 0))}</div>
          <div className="text-sm text-gray-700">Payment ID: {booking.paymentId || 'N/A'}</div>
          {booking.notes && <div className="text-sm text-gray-700">Notes: {booking.notes}</div>}
        </div>

        <div className="bg-white border rounded shadow p-4 space-y-2 md:col-span-2">
          <div className="font-semibold">Customer</div>
          <div className="text-sm text-gray-700">Name: {booking.customerName}</div>
          <div className="text-sm text-gray-700">Phone: {booking.customerPhone}</div>
          {booking.customerEmail && <div className="text-sm text-gray-700">Email: {booking.customerEmail}</div>}
          <div className="text-sm text-gray-700">Address: {[booking.addressLine1, booking.addressLine2, booking.city, booking.state, booking.postalCode].filter(Boolean).join(', ')}</div>
        </div>
      </div>

      <div>
        <a href="/admin/bookings" className="text-blue-600 hover:underline">← Back to Bookings</a>
      </div>
    </div>
  );
}