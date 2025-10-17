'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteProductButton({ id, slug, orderItemsCount }: { id: string; slug: string; orderItemsCount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (orderItemsCount > 0) {
      alert('This product has existing orders and cannot be deleted.');
      return;
    }
    const ok = confirm(`Delete product "${slug}"? This action is irreversible.`);
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${slug}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete product');
      }
    } catch (e) {
      console.error('Delete product failed:', e);
      alert('Delete product failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDelete}
      disabled={loading || orderItemsCount > 0}
      className={`text-red-600 hover:text-red-900 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={orderItemsCount > 0 ? 'Cannot delete product with orders' : 'Delete product'}
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}