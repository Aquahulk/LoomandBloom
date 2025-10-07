import { getSettings } from '@/app/lib/settings';
import Image from 'next/image';

export default async function AboutPage() {
  const settings = await getSettings();
  const heading = settings.about?.heading || 'About Bharat Pushpam';
  const intro = settings.about?.intro || '';
  const highlights = settings.about?.highlights || [];
  const social = settings.about?.social || {};
  const socialEntries = Object.entries(social).filter(
    ([, url]) => typeof url === 'string' && url
  );

  const icons: Record<string, React.ReactNode> = {
    instagram: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm12 1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 7a5 5 0 100 10 5 5 0 000-10z" />
      </svg>
    ),
    facebook: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 12a10 10 0 10-11.6 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.4.2 2.4.2v2.6h-1.4c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0022 12z" />
      </svg>
    ),
    twitter: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 001.87-2.35 8.54 8.54 0 01-2.7 1.03 4.26 4.26 0 00-7.26 3.89A12.1 12.1 0 013 4.8a4.26 4.26 0 001.32 5.68c-.67-.02-1.3-.21-1.85-.51v.05a4.26 4.26 0 003.42 4.17c-.6.16-1.23.18-1.84.07a4.27 4.27 0 003.98 2.96A8.54 8.54 0 013 19.54a12.06 12.06 0 006.53 1.91c7.84 0 12.12-6.49 12.12-12.12 0-.18-.01-.36-.02-.54A8.65 8.65 0 0022.46 6z" />
      </svg>
    ),
  };

  return (
    <div className="relative overflow-hidden">
      {/* Full-screen background decorations (moved out of the constrained container so they reach edges) */}
      <div aria-hidden className="pointer-events-none select-none fixed inset-0 z-0">
        {/* Left plant image - anchored to full left edge */}
        <Image
          src="/plant-left.png"
          alt=""
          width={300}
          height={300}
          className="hidden md:block absolute left-0 top-10 opacity-70 filter brightness-110 saturate-110"
        />

        {/* Right palm image - anchored to full right edge */}
        <Image
          src="/palm-right.png"
          alt=""
          width={320}
          height={320}
          className="hidden md:block absolute right-0 top-10 opacity-70 filter brightness-110 saturate-110"
        />

        {/* Hanging top-right kept in the viewport background (optional: can be moved into content area) */}
        <Image
          src="/hanging-top-right.png"
          alt=""
          width={180}
          height={180}
          className="absolute right-8 -top-10 opacity-25"
        />

        {/* Fern bottom image positioned relative to viewport */}
        <Image
          src="/fern-bottom.png"
          alt=""
          width={220}
          height={220}
          className="absolute left-10 -bottom-24 opacity-15"
        />
      </div>

      {/* Main content (z-10 so it sits above background decorations) */}
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">{heading}</h1>

        <div className="prose max-w-none">
          {intro && <p className="text-lg mb-6">{intro}</p>}

          {highlights.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Highlights</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                {highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}

          {socialEntries.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">Follow Us</h2>
              <div className="flex flex-wrap gap-3">
                {socialEntries.map(([name, url]) => (
                  <a
                    key={name}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                  >
                    {icons[name] || null}
                    <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
