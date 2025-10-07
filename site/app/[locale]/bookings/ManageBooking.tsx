"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Slot = { startMinutes: number; label: string; booked: boolean };

export default function ManageBooking() {
  const routeParams = useParams() as { id?: string; locale?: string };
  const [bookingId, setBookingId] = useState('');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Prefill from query params or route params and auto-load when ID is present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get('id') || '';
      const routedId = routeParams?.id || '';
      const selectedId = routedId || qId;
      const qPhone = params.get('phone') || '';
      if (selectedId) setBookingId(selectedId);
      if (qPhone) setPhone(qPhone);
      if (selectedId) {
        // Defer to allow state updates before load
        setTimeout(() => { loadBooking(selectedId); }, 0);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  async function loadBooking(idOverride?: string) {
    setError(null);
    setMessage(null);
    try {
      const id = idOverride || bookingId;
      if (!id) {
        throw new Error('Booking ID is missing. Please enter a valid ID.');
      }
      const res = await fetch(`/api/bookings/${id}`, { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response while loading booking', { status: res.status, url: res.url, contentType });
        throw new Error('Failed to load booking (non-JSON response). Please refresh or try again.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load booking');
      // If a phone is provided, verify it; otherwise allow direct load
      if (phone && data.booking.customerPhone !== phone) {
        throw new Error('Phone number does not match booking');
      }
      setBooking(data.booking);
      setDate(data.booking.date);
      setSelectedStart(data.booking.startMinutes);
      // Prefill editable fields
      setName(data.booking.customerName || '');
      setPhone(data.booking.customerPhone || '');
      setEmail(data.booking.customerEmail || '');
      setNotes(data.booking.notes || '');
      setAddressLine1(data.booking.addressLine1 || '');
      setAddressLine2(data.booking.addressLine2 || '');
      setCity(data.booking.city || '');
      setState(data.booking.state || '');
      setPostalCode(data.booking.postalCode || '');
      await loadSlots(data.booking.service.slug, data.booking.date);
    } catch (e: any) {
      setError(e.message);
      setBooking(null);
      // Reveal manual inputs so user can retry
      if (!bookingId) setBookingId('');
    }
  }

  async function loadSlots(slug: string, d: string) {
    try {
      const res = await fetch(`/api/services/${slug}/slots?date=${d}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load slots');
      setSlots(data.slots || []);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function reschedule() {
    if (!booking) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startMinutes: selectedStart })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reschedule failed');
      setMessage('Booking rescheduled successfully');
      setBooking(data.booking);
      if (data?.booking?.service?.slug) {
        await loadSlots(data.booking.service.slug, date);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function cancel() {
    if (!booking) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancel failed');
      setMessage('Booking cancelled');
      setBooking(data.booking);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function updateDetails() {
    if (!booking) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          notes,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setMessage('Details updated successfully');
      setBooking(data.booking);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-4">
      {bookingId && (
        <div className="text-xs px-3 py-2 rounded bg-green-50 border border-green-200 text-green-700">
          Loaded booking ID: {bookingId}
        </div>
      )}
      {!bookingId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className="border rounded px-3 py-2" placeholder="Booking ID" value={bookingId} onChange={e => setBookingId(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Phone (for verification)" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <button onClick={() => loadBooking()} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Load Booking</button>
        </>
      )}
      {error && <div className="text-red-600">{error}</div>}
      {message && <div className="text-green-700">{message}</div>}

      {booking && (
        <div className="space-y-3 border rounded p-4">
          <div className="font-semibold">{booking?.service?.name || 'Service'}</div>
          <div className="text-sm text-gray-600">Current: {booking.date}</div>
          <div className="flex items-center gap-3">
            <label className="font-medium">New date:</label>
            <input type="date" className="border rounded px-2 py-1" value={date} onChange={async e => { setDate(e.target.value); if (booking?.service?.slug) { await loadSlots(booking.service.slug, e.target.value); } }} />
          </div>
          {slots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {slots.map(s => (
                <button
                  key={s.startMinutes}
                  disabled={s.booked}
                  onClick={() => setSelectedStart(s.startMinutes)}
                  className={`border rounded px-3 py-2 text-left ${s.booked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : selectedStart === s.startMinutes ? 'border-green-600 bg-green-50' : 'hover:border-green-500'}`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-sm">{s.booked ? 'Unavailable' : 'Available'}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">No slots available for the selected date. Please choose another date.</div>
          )}
          <div className="flex gap-2">
            <button onClick={reschedule} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Reschedule</button>
            <button onClick={cancel} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Cancel</button>
          </div>
          <div className="pt-4 space-y-2">
            <div className="font-semibold">Edit Booking Details</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="border rounded px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <input className="w-full border rounded px-3 py-2" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
            <textarea className="w-full border rounded px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="font-semibold">Address</div>
            <input className="w-full border rounded px-3 py-2" placeholder="Address line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
            <input className="w-full border rounded px-3 py-2" placeholder="Address line 2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="border rounded px-3 py-2" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="State" value={state} onChange={e => setState(e.target.value)} />
              <input className="border rounded px-3 py-2" placeholder="Postal code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
            </div>
            <button onClick={updateDetails} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Update Details</button>
          </div>
        </div>
      )}
    </div>
  );
}