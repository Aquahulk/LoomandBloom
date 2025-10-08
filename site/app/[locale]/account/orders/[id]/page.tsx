import { prisma } from '@/app/lib/prisma';
import { getSessionFromCookies } from '@/app/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import CancelOrderButton from '../CancelOrderButton';
import { formatINR, paiseToRupees } from '@/app/lib/currency';
import { formatDateTimeIST } from '@/app/lib/date';

export default async function AccountOrderDetailsPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const session = await getSessionFromCookies();
  if (!session) return redirect(`/${locale}/login?next=/${locale}/account/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: true } }, variant: true } }
    }
  });

  if (!order || order.email !== session.email) return notFound();

  let parsedPaymentDetails: any = null;
  if (order.paymentDetails) {
    try { parsedPaymentDetails = JSON.parse(order.paymentDetails); } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order Details</h1>
        <div className="flex items-center gap-2">
          <Link href={`/${locale}/account/orders/${order.id}/invoice`} className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50">Download invoice</Link>
          <CancelOrderButton orderId={order.id} status={order.status as any} locale={locale} />
        </div>
      </div>

      <div className="bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-700">Order ID: {order.id}</div>
            <div className="text-sm text-gray-700">Placed on {formatDateTimeIST(order.createdAt)}</div>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-gray-100">{order.status}</span>
        </div>

        {/* Shipping */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-600">Shipping Address</h3>
            <div className="text-sm">{order.address}</div>
            <div className="text-sm">{order.city} {order.state ? `, ${order.state}` : ''}</div>
            <div className="text-sm">{order.pincode}</div>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-gray-600">Payment</h3>
            <div className="text-sm">Method: {order.paymentMethod || 'Razorpay'}</div>
            <div className="text-sm">Payment ID: {order.paymentId || 'N/A'}</div>
            <div className="text-sm">Status: {(order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED') ? 'Paid' : 'Pending'}</div>
          </div>
        </div>

        {/* Items */}
        <div className="mt-2">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Items</h3>
          <ul className="divide-y">
            {order.items.map(item => (
              <li key={item.id} className="py-2 flex justify-between">
                <div>
                  <div className="font-medium">{item.product.name}{item.variant ? ` - ${item.variant.name}` : ''}</div>
                  <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                </div>
                <div className="text-sm">{formatINR(paiseToRupees(item.unitPrice))}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex justify-end">
          <div className="text-sm font-semibold">Total: {formatINR(paiseToRupees(order.totalPrice))}</div>
        </div>
      </div>

      {/* Service Booking details for service-type orders */}
      {order.items.length === 0 && parsedPaymentDetails?.type === 'service' && (
        <div className="bg-white border rounded p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Service Booking</h3>
          <div className="space-y-1 text-sm">
            <div>Service: {parsedPaymentDetails.serviceName || 'Service'}</div>
            <div>Date: {parsedPaymentDetails.date}</div>
            {(() => { const hh = Math.floor((parsedPaymentDetails.startMinutes || 0) / 60); const mm = String((parsedPaymentDetails.startMinutes || 0) % 60).padStart(2, '0'); return (<div>Start: {hh}:{mm}</div>); })()}
          </div>
        </div>
      )}
    </div>
  );
}