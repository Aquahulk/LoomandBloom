import ManageBooking from '../ManageBooking';
import Link from 'next/link';
import HoldBanner from '@/app/components/HoldBanner';

export default async function Page() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <HoldBanner />
      <h1 className="text-2xl font-bold">Manage Your Booking</h1>
      <ManageBooking />
      <div className="pt-4 text-sm text-gray-600">
        <Link className="text-green-700 hover:underline" href="/services">← Back to Services</Link>
      </div>
    </div>
  );
}