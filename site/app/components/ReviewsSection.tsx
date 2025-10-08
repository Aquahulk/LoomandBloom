"use client";
import { useEffect, useState } from 'react';
import { formatDateIST } from '@/app/lib/date';

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

export default function ReviewsSection({ locale }: { locale: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'post'>('list');
  const [form, setForm] = useState({ name: '', rating: 5, comment: '', orderId: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      if (res.ok) {
        setForm({ name: '', rating: 5, comment: '', orderId: '' });
        setActiveTab('list');
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/60 border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          className={`chip chip-small ${activeTab === 'list' ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'}`}
          onClick={() => setActiveTab('list')}
        >
          Reviews
        </button>
        <button
          className={`chip chip-small ${activeTab === 'post' ? 'bg-green-600 text-white' : 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'}`}
          onClick={() => setActiveTab('post')}
        >
          Post a Review
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.length === 0 && (
            <div className="text-gray-600">Be the first to share your experience!</div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-gray-900">{r.name}</div>
                <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              </div>
              <div className="text-sm text-gray-600 line-clamp-4">{r.comment}</div>
              <div className="text-xs text-gray-400 mt-2">{formatDateIST(r.createdAt)}</div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Rating</label>
            <select
              className="input"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
            >
              {[5,4,3,2,1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Review</label>
            <textarea
              className="input min-h-[100px]"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Order ID (optional)</label>
            <input
              className="input"
              value={form.orderId}
              onChange={(e) => setForm({ ...form, orderId: e.target.value })}
              placeholder="e.g., BP-ORD-12345"
            />
          </div>
          <button disabled={submitting} className="btn btn-primary">
            {submitting ? 'Posting…' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
}