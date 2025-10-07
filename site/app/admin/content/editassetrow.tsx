"use client";
import { useState } from 'react';

type Asset = {
  id: string;
  title?: string | null;
  description?: string | null;
  order?: number | null;
  locale?: string | null;
  type?: string | null;
  categoryId?: string | null;
};

export default function EditAssetRow({ asset }: { asset: Asset }) {
  const [edits, setEdits] = useState<Partial<Asset>>({
    title: asset.title ?? '',
    description: asset.description ?? '',
    order: typeof asset.order === 'number' ? asset.order : null,
    locale: asset.locale ?? '',
    type: asset.type ?? 'BANNER',
  });
  const [categorySlug, setCategorySlug] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof Asset>(key: K, value: Asset[K]) {
    setEdits(prev => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/display', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: asset.id,
          title: edits.title,
          description: edits.description,
          order: edits.order,
          locale: edits.locale || null,
          type: edits.type,
          categorySlug: categorySlug || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setMessage('Saved');
      // Refresh to reflect updates
      window.location.reload();
    } catch (e: any) {
      setMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this asset?')) return;
    try {
      const res = await fetch(`/api/admin/display?id=${asset.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <input
            className="input w-full"
            placeholder="Title"
            value={(edits.title ?? '') as string}
            onChange={e => update('title', e.target.value)}
          />
          <textarea
            className="input w-full mt-2"
            placeholder="Description"
            value={(edits.description ?? '') as string}
            onChange={e => update('description', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={save} disabled={saving} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={remove} className="px-3 py-1 rounded border text-red-700 hover:border-red-600">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium">Order</label>
          <input
            type="number"
            className="input w-full"
            value={typeof edits.order === 'number' ? edits.order : ''}
            onChange={e => update('order', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div>
          <label className="text-xs font-medium">Locale</label>
          <input
            className="input w-full"
            placeholder="en or mr (optional)"
            value={(edits.locale ?? '') as string}
            onChange={e => update('locale', e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium">Type</label>
          <select
            className="input w-full"
            value={(edits.type ?? 'BANNER') as string}
            onChange={e => update('type', e.target.value)}
          >
            <option value="LOGO">LOGO</option>
            <option value="HERO">HERO</option>
            <option value="BANNER">BANNER</option>
            <option value="PROMO">PROMO</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Category Slug</label>
          <input
            className="input w-full"
            placeholder="e.g. fresh-plants"
            value={categorySlug}
            onChange={e => setCategorySlug(e.target.value)}
          />
        </div>
      </div>

      {message ? (
        <div className="text-xs text-gray-600">{message}</div>
      ) : null}
    </div>
  );
}