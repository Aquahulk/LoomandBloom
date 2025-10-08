"use client";
import { useState } from 'react';

export default function AdminBookingActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancelBooking() {
    setLoading('cancel');
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to cancel booking');
      }
      window.location.reload();
    } catch (e: any) {
      setError(e.message || 'Failed to cancel booking');
    } finally {
      setLoading(null);
    }
  }

  async function deleteBooking() {
    setLoading('delete');
    setError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete booking');
      }
      window.location.href = '/admin/bookings';
    } catch (e: any) {
      setError(e.message || 'Failed to delete booking');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <button
        onClick={cancelBooking}
        disabled={loading !== null || status === 'CANCELLED'}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {loading === 'cancel' ? 'Cancelling…' : 'Cancel'}
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={deleteBooking}
        disabled={loading !== null}
        className="text-gray-700 hover:text-black"
      >
        {loading === 'delete' ? 'Deleting…' : 'Delete'}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  );
}