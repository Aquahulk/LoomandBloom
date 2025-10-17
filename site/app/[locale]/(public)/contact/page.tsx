"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ContactPage() {
  const [heading, setHeading] = useState<string>('Contact Us');
  const [intro, setIntro] = useState<string>(
    "Have questions about our plants or services? Send us a message and we'll respond as soon as possible."
  );
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [storeAddress, setStoreAddress] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('6260122094');

  useEffect(() => {
    // Load public settings to populate store address and WhatsApp number
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.storeAddress) setStoreAddress(data.storeAddress);
        if (data?.whatsappNumber) setWhatsappNumber(String(data.whatsappNumber));
        if (data?.contact?.heading) setHeading(String(data.contact.heading));
        if (data?.contact?.intro) setIntro(String(data.contact.intro));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || whatsappNumber;
    const message = `New inquiry from ${formData.name} (${formData.email}, ${formData.phone}): ${formData.message}`;
    const waUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="relative overflow-hidden">
      {/* ✅ Full-screen background decorations */}
      <div aria-hidden className="pointer-events-none select-none fixed inset-0 z-0">
        {/* Left plant image - full left edge */}
        <Image
          src="/plant-left.png"
          alt=""
          width={320}
          height={320}
          className="hidden md:block absolute left-0 top-10 opacity-70 filter brightness-110 saturate-110"
        />
        {/* Right palm image - full right edge */}
        <Image
          src="/palm-right.png"
          alt=""
          width={320}
          height={320}
          className="hidden md:block absolute right-0 top-10 opacity-70 filter brightness-110 saturate-110"
        />
      </div>

      {/* ✅ Main content area */}
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Top decorative image */}
        <Image
          src="/hanging-top-right.png"
          alt=""
          width={160}
          height={160}
          className="absolute right-40 -top-8 opacity-25"
        />

        <h1 className="text-3xl font-semibold mb-6">{heading}</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left info section */}
          <div className="relative">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            <p className="mb-6">{intro}</p>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium">WhatsApp</h3>
                <a
                  href={`https://wa.me/91${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div>
                <h3 className="font-medium">Services</h3>
                <ul className="text-sm text-gray-600">
                  <li>• Plant Maintenance</li>
                  <li>• Garden Installation</li>
                  <li>• Kitchen Gardening Setup</li>
                  <li>• Plants on Rent</li>
                  <li>• Plant Hostel Service</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right contact form */}
          <div className="relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Tell us about your plant needs or questions..."
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
              >
                Send via WhatsApp
              </button>
            </form>
          </div>
        </div>

        {/* Store section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Visit Our Store</h2>
          <div className="bg-gray-100 p-4 rounded-lg space-y-2">
            {storeAddress ? (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-line">{storeAddress}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-green-700 hover:underline"
                >
                  Open in Google Maps
                </a>
                <p className="text-xs text-gray-500">For store hours, message us on WhatsApp.</p>
              </>
            ) : (
              <p className="text-sm text-gray-600">
                We&apos;re working on adding our store location and map.
                For now, please contact us via WhatsApp for directions and store hours.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
