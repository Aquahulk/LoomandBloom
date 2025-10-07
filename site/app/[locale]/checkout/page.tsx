"use client";
import { useState } from 'react';
import Script from 'next/script';

// Minimal local typings for Razorpay browser SDK
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  handler?: () => void;
};

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 19900 }) // ₹199 demo
      });
      const data = await res.json();
      if (!data.order) throw new Error(data.error || 'Order failed');

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
      if (!keyId) {
        alert('Razorpay key is not configured.');
        return;
      }
      const options: RazorpayOptions = {
        key: keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Bharat Pushpam',
        description: 'Demo Order',
        order_id: data.order.id,
        handler: function () {
          alert('Payment successful (test).');
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed';
      alert(message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Checkout (Test)</h1>
      <button className="px-5 py-3 rounded-md bg-green-700 text-white" onClick={startPayment} disabled={loading}>
        {loading ? 'Starting…' : 'Pay ₹199 (test)'}
      </button>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    </div>
  );
}


