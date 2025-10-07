import { getSettings } from '@/app/lib/settings';
import Link from 'next/link';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const settings = await getSettings();
  const content = settings.legal?.privacy || 'Privacy policy will be available soon.';
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <nav className="text-sm mb-4">
        <Link href={`/${locale}`} className="text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <span>Privacy Policy</span>
      </nav>
      <h1 className="text-3xl font-semibold mb-4">Privacy Policy</h1>
      <article className="prose prose-green max-w-none whitespace-pre-line">
        {content}
      </article>
    </div>
  );
}