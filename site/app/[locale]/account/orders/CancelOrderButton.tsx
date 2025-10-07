"use client";
import { useState } from 'react';
import { useToast } from '@/app/components/Toast';

export default function CancelOrderButton({ orderId, status, locale }: { orderId: string; status: string; locale: string }) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const eligible = status === 'PENDING' || status === 'PAID';
  if (!eligible) return null;

  async function cancel() {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/orders/cancel?orderId=${encodeURIComponent(orderId)}&locale=${encodeURIComponent(locale)}`, {
        method: 'POST'
      });
      if (res.redirected) {
        showToast({ variant: 'success', title: status === 'PAID' ? 'Refund initiated' : 'Order cancelled' });
        window.location.href = res.url;
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Cancellation failed');
      showToast({ variant: 'success', title: status === 'PAID' ? 'Refund initiated' : 'Order cancelled' });
      // Reload orders page
      window.location.reload();
    } catch (e: any) {
      showToast({ variant: 'error', title: 'Cancellation failed', description: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={cancel} disabled={loading} className={`px-3 py-1.5 rounded border text-sm ${loading ? 'opacity-50' : 'hover:bg-gray-50'}`}>
      {loading ? 'Cancelling…' : (status === 'PAID' ? 'Cancel & Refund' : 'Cancel Order')}
    </button>
  );
}