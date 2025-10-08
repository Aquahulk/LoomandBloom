"use client";
import { useEffect, useState } from 'react';
import { todayISTYYYYMMDD } from '@/app/lib/date';

type Slot = { startMinutes: number; label: string; booked: boolean };

export default function BookingWidget({ serviceSlug }: { serviceSlug: string }) {
  // Default to today in IST (Asia/Kolkata) to avoid user-local offsets
  const [date, setDate] = useState<string>(() => todayISTYYYYMMDD());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [allowedPrefixes, setAllowedPrefixes] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  function normalizeDate(input: string) {
    const ddmmyyyy = input.match(/^([0-3]\d)-([0-1]\d)-(\d{4})$/);
    if (ddmmyyyy) {
      const [, dd, mm, yyyy] = ddmmyyyy;
      return `${yyyy}-${mm}-${dd}`;
    }
    return input; // assume YYYY-MM-DD
  }

  async function loadSlots() {
    setLoading(true);
    setError(null);
    try {
      const dNorm = normalizeDate(date);
      const url = `/api/services/${serviceSlug}/slots?date=${dNorm}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load slots');
      setSlots(Array.isArray(data.slots) ? data.slots : []);
      try { console.log('[BookingWidget] slots', { date: dNorm, count: Array.isArray(data.slots) ? data.slots.length : 0 }); } catch {}
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSlots(); }, [date]);
  // Periodic refresh to reflect bookings/payments made by anyone
  useEffect(() => {
    const timer = setInterval(() => { loadSlots(); }, 15000);
    return () => clearInterval(timer);
  }, [date]);

  // Load public settings to get bookings allowed pincode prefixes (fallback to Pune defaults)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data = await res.json();
        const prefixes = data?.bookings?.allowedPincodePrefixes || data?.checkout?.allowedPincodePrefixes || [];
        if (Array.isArray(prefixes) && prefixes.length > 0) {
          setAllowedPrefixes(prefixes);
        } else {
          // Pune district defaults
          setAllowedPrefixes(['411', '412', '4131']);
        }
      } catch {
        setAllowedPrefixes(['411', '412', '4131']);
      }
    })();
  }, []);

  async function book() {
    if (!selectedStart || !name || !phone) {
      setError('Please select a slot and enter name & phone');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      // Validate address fields compulsory
      const line1 = (addressLine1 || '').trim();
      const cty = (city || '').trim();
      const pin = (postalCode || '').trim();
      if (!line1 || !cty || !pin) {
        throw new Error('Please fill Address line 1, City and Pincode');
      }
      // Validate pincode format and allowed prefixes (Maharashtra Pune-only)
      const pinRegex = /^[1-9][0-9]{5}$/;
      if (!pinRegex.test(pin)) {
        throw new Error('Please enter a valid 6-digit pincode');
      }
      const isAllowed = allowedPrefixes.length === 0 ? true : allowedPrefixes.some(p => pin.startsWith(p));
      if (!isAllowed) {
        throw new Error('We currently serve only Pune (Maharashtra) district pincodes for services.');
      }

      const res = await fetch(`/api/services/${serviceSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          startMinutes: selectedStart,
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
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setSuccess(`Booking created. Redirecting to payment…`);
      // Redirect to payment checkout
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
      setSelectedStart(null);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
      // Reload slots to reflect booking
      loadSlots();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="font-medium">Date:</label>
        <input type="date" className="border rounded px-2 py-1" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div>
        <div className="font-semibold mb-2">Available Slots</div>
        {loading ? (
          <div className="text-gray-600">Loading slots…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : slots.length > 0 ? (
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
      </div>

      <div className="space-y-2">
        <div className="font-semibold">Your Details</div>
        <input className="w-full border rounded px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
        <textarea className="w-full border rounded px-3 py-2" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <div className="font-semibold pt-2">Address</div>
        <input className="w-full border rounded px-3 py-2" placeholder="Address line 1" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Address line 2" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className="border rounded px-3 py-2" placeholder="City" value={city} onChange={e => setCity(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="State" value={state} onChange={e => setState(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Postal code" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
        </div>
        <button onClick={book} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Confirm Booking</button>
        {success && <div className="text-green-700">{success}</div>}
        {error && <div className="text-red-600">{error}</div>}
      </div>
    </div>
  );
}