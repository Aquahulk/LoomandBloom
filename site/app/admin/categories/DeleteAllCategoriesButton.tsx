'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAllCategoriesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDeleteAll = async () => {
    const ok = confirm('Delete ALL categories and their products? This cannot be undone.');
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories/delete-all', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert(`Deleted ${data.deletedCategories} categories, ${data.deletedProducts} products.${data.skippedProducts ? ` Skipped ${data.skippedProducts} products with orders.` : ''}`);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to delete categories');
      }
    } catch (e) {
      console.error('Bulk delete categories failed:', e);
      alert('Bulk delete categories failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDeleteAll}
      disabled={loading}
      className={`bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title="Delete all categories and products"
    >
      {loading ? 'Deleting…' : 'Delete All Categories'}
    </button>
  );
}