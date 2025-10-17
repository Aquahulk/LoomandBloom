'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAllProductsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDeleteAll = async () => {
    const ok = confirm('Delete ALL products? This will remove images and cannot be undone.');
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/delete-all', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Deleted all eligible products');
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete all products');
      }
    } catch (e) {
      console.error('Bulk delete products failed:', e);
      alert('Bulk delete products failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDeleteAll}
      disabled={loading}
      className={`bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Delete all products"
    >
      {loading ? 'Deleting…' : 'Delete All Products'}
    </button>
  );
}