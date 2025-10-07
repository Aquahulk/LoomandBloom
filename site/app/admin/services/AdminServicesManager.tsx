"use client";
import { useEffect, useState } from 'react';

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceMin: number;
  imagePublicId?: string | null;
};

export default function AdminServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [edits, setEdits] = useState<Record<string, Partial<Service>>>({});
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMin, setPriceMin] = useState<number>(0);
  const [imagePublicId, setImagePublicId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/admin/services');
    const data = await res.json();
    if (res.ok) setServices(data.services || []);
  }

  async function createService() {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, priceMin, imagePublicId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      setMessage('Service created');
      setName('');
      setDescription('');
      setPriceMin(0);
      setImagePublicId('');
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateService(id: string, patch: Partial<Service>) {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setMessage('Service updated');
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteService(id: string) {
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setMessage('Service deleted');
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="border rounded p-4">
        <div className="font-semibold mb-2">Create Service</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Starting price (₹)" type="number" value={priceMin} onChange={e => setPriceMin(Number(e.target.value))} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Cloudinary public ID (e.g. services/garden-services)" value={imagePublicId} onChange={e => setImagePublicId(e.target.value)} />
          <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button onClick={createService} className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Create</button>
        {message && <div className="text-green-700 mt-2">{message}</div>}
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>

      <div className="border rounded p-4">
        <div className="font-semibold mb-3">Existing Services</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="border rounded overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100">
                {// eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imagePublicId ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkwrsd0qc'}/image/upload/c_fill,f_auto,q_auto,w_600/${s.imagePublicId}` : `https://via.placeholder.com/600x450/10b981/ffffff?text=${encodeURIComponent(s.name.split(' ')[0])}`}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />}
              </div>
              <div className="p-3 space-y-2">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Service name"
                  value={(edits[s.id]?.name ?? s.name) as string}
                  onChange={e => setEdits(prev => ({ ...prev, [s.id]: { ...prev[s.id], name: e.target.value } }))}
                />
                <textarea
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Description"
                  value={(edits[s.id]?.description ?? s.description) as string}
                  onChange={e => setEdits(prev => ({ ...prev, [s.id]: { ...prev[s.id], description: e.target.value } }))}
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">₹</span>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="number"
                    placeholder="Starting price"
                    value={(edits[s.id]?.priceMin ?? s.priceMin) as number}
                    onChange={e => setEdits(prev => ({ ...prev, [s.id]: { ...prev[s.id], priceMin: Number(e.target.value) } }))}
                  />
                </div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Cloudinary public ID"
                  value={(edits[s.id]?.imagePublicId ?? s.imagePublicId ?? '') as string}
                  onChange={e => setEdits(prev => ({ ...prev, [s.id]: { ...prev[s.id], imagePublicId: e.target.value } }))}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => updateService(s.id, edits[s.id] || {})}
                    className="px-3 py-1 border rounded bg-blue-600 text-white hover:bg-blue-700"
                  >Save</button>
                  <button
                    onClick={() => setEdits(prev => ({ ...prev, [s.id]: {} }))}
                    className="px-3 py-1 border rounded hover:border-gray-600"
                  >Reset</button>
                  <button onClick={() => deleteService(s.id)} className="ml-auto px-3 py-1 border rounded text-red-700 hover:border-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}