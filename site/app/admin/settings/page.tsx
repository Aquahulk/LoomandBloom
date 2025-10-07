import { getSettings } from '@/app/lib/settings';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="border-b">
        <nav className="flex gap-4 px-1">
          <a href="/admin/orders" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Orders</a>
          <a href="/admin/bookings" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Bookings</a>
          <a href="/admin/images" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Images</a>
          <a href="/admin/content" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Content</a>
          <a href="/admin/settings" className="px-3 py-2 text-sm font-medium border-b-2 border-green-600 text-green-700">Settings</a>
          <a href="/api/admin/logout" className="ml-auto px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700">Logout</a>
        </nav>
      </div>
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <p className="text-sm text-gray-600">Configure checkout, bookings, banners, and site-wide options.</p>
      <SettingsForm initial={settings} />
    </div>
  );
}