"use client";
import { useEffect, useState } from 'react';

type Review = {
  id: string;
  name: string;
  comment: string;
  rating: number;
  locale: string;
  orderId?: string;
  productSlug?: string;
  createdAt: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const ok = confirm('Delete this review?');
    if (!ok) return;
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await load();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Customer Reviews</h1>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {reviews.length === 0 && (
            <div className="text-gray-600">No reviews yet.</div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-200 p-4 bg-white flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">{r.name} <span className="text-yellow-500 ml-2">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
                <div className="text-sm text-gray-700 mt-1">{r.comment}</div>
                <div className="text-xs text-gray-400 mt-1">{r.orderId ? `Order: ${r.orderId}` : 'No order reference'} • {new Date(r.createdAt).toLocaleString()}</div>
              </div>
              <button className="btn btn-danger" onClick={() => remove(r.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}