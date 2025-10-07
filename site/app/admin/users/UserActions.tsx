"use client";

import { useState } from 'react';

export default function UserActions({ id, isOnHold }: { id: string; isOnHold?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleHold(nextHold: boolean) {
    if (!confirm(nextHold ? 'Put this account on hold?' : 'Remove hold from this account?')) return;
    setBusy('hold');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnHold: nextHold })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update');
      }
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Update failed');
    } finally {
      setBusy(null);
    }
  }

  async function deleteUser() {
    if (!confirm('Delete this user account? This cannot be undone.')) return;
    setBusy('delete');
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Delete failed');
      }
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => toggleHold(!isOnHold)}
        disabled={busy !== null}
        className={`text-xs px-2 py-1 rounded border ${isOnHold ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'bg-blue-50 text-blue-700 border-blue-300'}`}
      >
        {busy === 'hold' ? 'Updating…' : isOnHold ? 'Remove Hold' : 'Put on Hold'}
      </button>
      <button
        onClick={deleteUser}
        disabled={busy !== null}
        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
      >
        {busy === 'delete' ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}