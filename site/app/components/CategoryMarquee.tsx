import Link from 'next/link';

type Cat = { id: string; name: string; slug: string; products?: Array<any> };

export default function CategoryMarquee({ locale, categories }: { locale: string; categories: Cat[] }) {
  const items = categories.map(c => ({ id: c.id, name: c.name, slug: c.slug, count: (c.products || []).length }));
  const doubled = [...items, ...items];
  return (
    <div className="marquee py-3">
      <div className="marquee-track">
        {doubled.map((c, i) => (
          <Link
            key={`${c.id}-${i}`}
            href={`/${locale}/products?category=${c.slug}`}
            className="chip bg-white border-green-200 hover:from-green-500/10 hover:to-emerald-500/10"
          >
            <span className="inline-flex items-center gap-1">
              <span>🌿</span>
              <span>{c.name}</span>
            </span>
            {typeof c.count === 'number' && (
              <span className="text-xs font-semibold text-green-700">{c.count}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}