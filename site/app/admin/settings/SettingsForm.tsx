"use client";
import { useState } from 'react';

type Settings = {
  maintenanceMode: boolean;
  holdBannerText: string;
  supportEmail: string;
  whatsappNumber: string;
  storeAddress: string;
  about?: {
    heading?: string;
    intro?: string;
    highlights?: string[];
    social?: {
      instagram?: string;
      facebook?: string;
      twitter?: string;
    };
  };
  contact?: {
    heading?: string;
    intro?: string;
  };
  legal?: {
    privacy?: string;
    terms?: string;
  };
  admin?: {
    username: string;
    passwordHash?: string;
    password?: string;
  };
  invoice?: {
    companyName: string;
    companyAddress: string;
    gstNumber?: string;
    logoPublicId?: string;
    footerNote?: string;
    themeColor?: string;
    taxPercent?: number;
  };
  checkout: {
    minOrderValue: number;
    maxOrderValue: number;
    freeDeliveryThreshold: number;
    deliveryFee: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };
  bookings: {
    bookingMaxDaysAdvance: number;
    sameDayCutoffMinutes: number;
    blackoutDates: string[];
    serviceAllowedPincodes: string[];
    capacityPerSlot: number;
  };
  notifications: {
    enableSms: boolean;
  };
};

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'Maintenance' | 'About' | 'Contact' | 'Legal' | 'Checkout' | 'Invoice' | 'Bookings' | 'Notifications' | 'Admin'>('Checkout');
  const [adminPassword, setAdminPassword] = useState('');

  const update = (path: string, value: any) => {
    setSettings(prev => {
      const next: any = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setMessage('Settings saved successfully');
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-md border p-3 ${message.includes('success') ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</div>
      )}
      {/* Tabs */}
      <div className="border-b">
        <div className="flex flex-wrap gap-2">
          {(['Maintenance','About','Contact','Legal','Checkout','Invoice','Bookings','Notifications','Admin'] as const).map(name => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={`px-3 py-1.5 text-sm rounded-t ${tab === name ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {tab === 'Maintenance' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Maintenance Mode</h2>
          <p className="text-xs text-gray-600">Disables checkout and bookings; site remains browseable.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.maintenanceMode} onChange={e => update('maintenanceMode', e.target.checked)} />
            Enable maintenance (disable checkout/booking for everyone)
          </label>
        </section>
      )}

      {tab === 'About' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">About Page Content</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Heading</label>
              <input className="input w-full" value={settings.about?.heading ?? ''} onChange={e => update('about.heading', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Introduction</label>
              <textarea className="input w-full" rows={3} value={settings.about?.intro ?? ''} onChange={e => update('about.intro', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Highlights (one per line)</label>
              <textarea
                className="input w-full"
                rows={5}
                value={(settings.about?.highlights ?? []).join('\n')}
                onChange={e => update('about.highlights', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              />
            </div>
          </div>
          <h3 className="text-sm font-semibold mt-2">Social Links</h3>
          <p className="text-xs text-gray-600">Add full URLs for platforms to display on the About page.</p>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Instagram</label>
              <input className="input w-full" value={settings.about?.social?.instagram ?? ''} onChange={e => update('about.social.instagram', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Facebook</label>
              <input className="input w-full" value={settings.about?.social?.facebook ?? ''} onChange={e => update('about.social.facebook', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Twitter</label>
              <input className="input w-full" value={settings.about?.social?.twitter ?? ''} onChange={e => update('about.social.twitter', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Admin' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Admin Credentials</h2>
          <p className="text-xs text-gray-600">Update admin login username and password used for /admin.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Admin Username</label>
              <input className="input w-full" value={settings.admin?.username ?? ''} onChange={e => update('admin.username', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Password</label>
              <input
                type="password"
                className="input w-full"
                value={adminPassword}
                placeholder="Enter new password (leave blank to keep)"
                onChange={e => { setAdminPassword(e.target.value); update('admin.password', e.target.value); }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">Note: Password is stored securely as a hash in settings.</p>
        </section>
      )}

      {tab === 'Contact' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Contact & Banner</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Contact Page Heading</label>
              <input className="input w-full" value={settings.contact?.heading ?? ''} onChange={e => update('contact.heading', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Contact Page Introduction</label>
              <textarea className="input w-full" value={settings.contact?.intro ?? ''} onChange={e => update('contact.intro', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Support Email <span className="text-xs text-gray-500">(shown on Contact page)</span></label>
              <input className="input w-full" value={settings.supportEmail} onChange={e => update('supportEmail', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">WhatsApp Number <span className="text-xs text-gray-500">(e.g. 9009491983)</span></label>
              <input className="input w-full" value={settings.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Store Address <span className="text-xs text-gray-500">(appears in footer/contact)</span></label>
              <textarea className="input w-full" value={settings.storeAddress} onChange={e => update('storeAddress', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Hold Banner Text <span className="text-xs text-gray-500">(small banner across pages)</span></label>
              <textarea className="input w-full" value={settings.holdBannerText} onChange={e => update('holdBannerText', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Legal' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Legal Pages</h2>
          <p className="text-xs text-gray-600">Edit the content shown on Privacy Policy and Terms & Conditions pages.</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Privacy Policy</label>
              <textarea className="input w-full" rows={8} value={settings.legal?.privacy ?? ''} onChange={e => update('legal.privacy', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Terms & Conditions</label>
              <textarea className="input w-full" rows={8} value={settings.legal?.terms ?? ''} onChange={e => update('legal.terms', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Checkout' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Checkout Policies</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Min Order (₹)</label>
              <input type="number" className="input w-full" value={Math.floor((settings.checkout.minOrderValue || 0) / 100)} onChange={e => update('checkout.minOrderValue', parseInt(e.target.value || '0', 10) * 100)} />
            </div>
            <div>
              <label className="text-sm font-medium">Max Order (₹) <span className="text-xs text-gray-500">(upper limit)</span></label>
              <input type="number" className="input w-full" value={Math.floor((settings.checkout.maxOrderValue || 0) / 100)} onChange={e => update('checkout.maxOrderValue', parseInt(e.target.value || '0', 10) * 100)} />
            </div>
            <div>
              <label className="text-sm font-medium">Free Delivery Threshold (₹) <span className="text-xs text-gray-500">(0 disables)</span></label>
              <input type="number" className="input w-full" value={Math.floor((settings.checkout.freeDeliveryThreshold || 0) / 100)} onChange={e => update('checkout.freeDeliveryThreshold', parseInt(e.target.value || '0', 10) * 100)} />
            </div>
            <div>
              <label className="text-sm font-medium">Delivery Fee (₹)</label>
              <input type="number" className="input w-full" value={Math.floor((settings.checkout.deliveryFee || 0) / 100)} onChange={e => update('checkout.deliveryFee', parseInt(e.target.value || '0', 10) * 100)} />
            </div>
            <div>
              <label className="text-sm font-medium">Rate Limit Window (ms) <span className="text-xs text-gray-500">(e.g. 60000)</span></label>
              <input type="number" className="input w-full" value={settings.checkout.rateLimitWindowMs} onChange={e => update('checkout.rateLimitWindowMs', parseInt(e.target.value || '0', 10))} />
            </div>
            <div>
              <label className="text-sm font-medium">Rate Limit Max Requests <span className="text-xs text-gray-500">(per window)</span></label>
              <input type="number" className="input w-full" value={settings.checkout.rateLimitMaxRequests} onChange={e => update('checkout.rateLimitMaxRequests', parseInt(e.target.value || '0', 10))} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Invoice' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Invoice Settings</h2>
          <p className="text-xs text-gray-600">Customize the invoice generated for each order.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <input className="input w-full" value={settings.invoice?.companyName ?? ''} onChange={e => update('invoice.companyName', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">GST Number</label>
              <input className="input w-full" value={settings.invoice?.gstNumber ?? ''} onChange={e => update('invoice.gstNumber', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Company Address</label>
              <textarea className="input w-full" value={settings.invoice?.companyAddress ?? ''} onChange={e => update('invoice.companyAddress', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Logo Public ID <span className="text-xs text-gray-500">(Cloudinary)</span></label>
              <input className="input w-full" value={settings.invoice?.logoPublicId ?? ''} onChange={e => update('invoice.logoPublicId', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Theme Color</label>
              <input type="color" className="input w-16 h-10 p-0" value={settings.invoice?.themeColor ?? '#16a34a'} onChange={e => update('invoice.themeColor', e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Tax Percentage (%)</label>
              <input type="number" className="input w-full" value={settings.invoice?.taxPercent ?? 0} onChange={e => update('invoice.taxPercent', parseInt(e.target.value || '0', 10))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Footer Note</label>
              <textarea className="input w-full" value={settings.invoice?.footerNote ?? ''} onChange={e => update('invoice.footerNote', e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Bookings' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Bookings & Services</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Max Advance Days <span className="text-xs text-gray-500">(limit future bookings)</span></label>
              <input type="number" className="input w-full" value={settings.bookings.bookingMaxDaysAdvance} onChange={e => update('bookings.bookingMaxDaysAdvance', parseInt(e.target.value || '0', 10))} />
            </div>
            <div>
              <label className="text-sm font-medium">Same-day Cutoff (minutes) <span className="text-xs text-gray-500">(before slot start)</span></label>
              <input type="number" className="input w-full" value={settings.bookings.sameDayCutoffMinutes} onChange={e => update('bookings.sameDayCutoffMinutes', parseInt(e.target.value || '0', 10))} />
            </div>
            <div>
              <label className="text-sm font-medium">Capacity per Slot <span className="text-xs text-gray-500">(max concurrent bookings)</span></label>
              <input type="number" className="input w-full" value={settings.bookings.capacityPerSlot} onChange={e => update('bookings.capacityPerSlot', parseInt(e.target.value || '0', 10))} />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Blackout Dates <span className="text-xs text-gray-500">(comma separated YYYY-MM-DD)</span></label>
              <input className="input w-full" value={settings.bookings.blackoutDates.join(',')} onChange={e => update('bookings.blackoutDates', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium">Allowed Pincodes <span className="text-xs text-gray-500">(comma separated; empty = all)</span></label>
              <input className="input w-full" value={settings.bookings.serviceAllowedPincodes.join(',')} onChange={e => update('bookings.serviceAllowedPincodes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </div>
          </div>
        </section>
      )}

      {tab === 'Notifications' && (
        <section className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-xs text-gray-600">SMS requires provider configuration; toggle enables sending where available.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.notifications.enableSms} onChange={e => update('notifications.enableSms', e.target.checked)} />
            Enable SMS notifications
          </label>
        </section>
      )}

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}