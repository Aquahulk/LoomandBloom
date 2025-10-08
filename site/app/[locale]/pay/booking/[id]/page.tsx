"use client";
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { formatINR, paiseToRupees } from '@/app/lib/currency';
import { useToast } from '@/app/components/Toast';

export default function PayBookingPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Fire-and-forget cleanup to auto-cancel stale pending orders/bookings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/payments/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: 10 })
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/bookings/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load booking');
        setBooking(data.booking);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  async function startPayment() {
    if (!booking) return;
    try {
      const res = await fetch(`/api/payments/booking/${booking.id}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!data.order) throw new Error(data.error || 'Order failed');
      const devAutoConfirm = process.env.NEXT_PUBLIC_PAYMENTS_DEV_AUTO_CONFIRM === '1';
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
      if (!keyId && devAutoConfirm) {
        // Dev mode: directly verify and confirm without Razorpay UI
        try {
          const verifyRes = await fetch('/api/payments/booking/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: data.order.id,
              paymentId: 'dev_payment',
              signature: 'dev',
              bookingId: booking.id
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setBooking(verifyData.booking);
            showToast({ variant: 'success', title: 'Payment confirmed', description: 'Booking confirmed (dev mode).' });
          } else {
            showToast({ variant: 'error', title: 'Payment verification failed', description: 'Dev mode.' });
          }
        } catch (err) {
          showToast({ variant: 'error', title: 'Payment verification error', description: 'Dev mode.' });
        }
        return;
      }
      if (!keyId) {
        showToast({ variant: 'error', title: 'Razorpay key missing', description: 'Configure payment key.' });
        return;
      }

      const options: any = {
        key: keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Bharat Pushpam',
        description: booking.service?.name || 'Service Booking',
        order_id: data.order.id,
        prefill: {
          name: booking.customerName || '',
          email: booking.customerEmail || '',
          contact: booking.customerPhone || ''
        },
        notes: { bookingId: booking.id },
        modal: {
          // When user closes/dismisses the Razorpay popup, cancel booking and redirect
          ondismiss: async () => {
            try {
              await fetch(`/api/payments/booking/${booking.id}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'dismissed' })
              });
            } catch (_) {}
            showToast({ variant: 'error', title: 'Payment cancelled', description: 'You dismissed the payment.' });
            // Redirect to orders page
            const { locale } = await params;
            window.location.href = `/${locale}/account/orders`;
          }
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/booking/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: booking.id
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setBooking(verifyData.booking);
              showToast({ variant: 'success', title: 'Payment successful', description: 'Booking confirmed.' });
              const { locale } = await params;
              window.location.href = `/${locale}/account/orders`;
            } else {
              showToast({ variant: 'error', title: 'Payment verification failed' });
              const { locale } = await params;
              window.location.href = `/${locale}/account/orders`;
            }
          } catch (err) {
            showToast({ variant: 'error', title: 'Payment verification error' });
            const { locale } = await params;
            window.location.href = `/${locale}/account/orders`;
          }
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response: any) {
        const err = response?.error || {};
        const details = [
          err.code && `Code: ${err.code}`,
          err.reason && `Reason: ${err.reason}`,
          err.description && `Description: ${err.description}`
        ].filter(Boolean).join('\n');
        showToast({ variant: 'error', title: 'Payment failed', description: details || undefined });
        try {
          await fetch(`/api/payments/booking/${booking.id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'payment_failed' })
          });
        } catch (_) {}
        const { locale } = await params;
        window.location.href = `/${locale}/account/orders`;
      });
      rzp.open();
      // Fallback: poll booking status until confirmed
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/bookings/${booking!.id}`);
          const data = await res.json();
          if (data?.booking?.status === 'CONFIRMED') {
            setBooking(data.booking);
            clearInterval(poll);
          }
        } catch {}
      }, 3000);
      setTimeout(() => clearInterval(poll), 60000);
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Checkout failed', description: e.message });
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : booking ? (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <div className="font-semibold">{booking.service?.name || 'Service'}</div>
            <div className="text-sm text-gray-600">Date: {booking.date}</div>
            <div className="text-sm text-gray-600">Customer: {booking.customerName}</div>
            <div className="text-sm text-gray-600">Phone: {booking.customerPhone}</div>
            <div className="text-sm text-gray-600">Address: {[booking.addressLine1, booking.addressLine2, booking.city, booking.state, booking.postalCode].filter(Boolean).join(', ')}</div>
            <div className="text-sm text-gray-600">Status: {booking.status}</div>
            {booking.amountPaid ? (
              <div className="text-sm text-gray-600">Paid: {formatINR(paiseToRupees(booking.amountPaid))}</div>
            ) : null}
          </div>
          {booking.status === 'CONFIRMED' ? (
            <div className="space-y-2">
              <p className="text-green-700">Booking confirmed and payment recorded.</p>
              <a href="/en/account/orders" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Go to My Orders</a>
            </div>
          ) : booking.status === 'CANCELLED' ? (
            <div className="space-y-2">
              <p className="text-red-700">Payment cancelled. This booking won’t be processed.</p>
              <a href="/en/account/orders" className="inline-block bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Go to My Orders</a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-700">Click below to pay securely via Razorpay.</p>
              <button onClick={startPayment} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Pay Now</button>
            </div>
          )}
        </div>
      ) : (
        <div>No booking found.</div>
      )}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );
}