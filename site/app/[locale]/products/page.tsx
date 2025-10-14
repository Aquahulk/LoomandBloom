import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import ProductImage from './ProductImage';
import HoldBanner from '@/app/components/HoldBanner';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

export default async function ProductsIndex({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ category?: string; sort?: string; inStock?: string; min?: string; max?: string }> }) {
  const { locale } = await params;
  const paramsObj = await searchParams;
  const categorySlug = paramsObj.category;
  const sort = paramsObj.sort || 'new';
  const inStockOnly = paramsObj.inStock === '1';
  const min = paramsObj.min ? parseInt(paramsObj.min) : undefined;
  const max = paramsObj.max ? parseInt(paramsObj.max) : undefined;
  const minPaise = typeof min === 'number' && !Number.isNaN(min) ? min * 100 : undefined;
  const maxPaise = typeof max === 'number' && !Number.isNaN(max) ? max * 100 : undefined;

  const where = {
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(inStockOnly ? { stock: { gt: 0 } } : {}),
    ...(typeof minPaise === 'number' && !Number.isNaN(minPaise) ? { price: { gte: minPaise } } : {}),
    ...(typeof maxPaise === 'number' && !Number.isNaN(maxPaise) ? { price: { lte: maxPaise } } : {}),
  };

  const orderBy = sort === 'price-asc' ? { price: 'asc' as const } : sort === 'price-desc' ? { price: 'desc' as const } : { createdAt: 'desc' as const };
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ 
      where, 
      orderBy, 
      take: 48,
      include: {
        images: { orderBy: { position: 'asc' } }
      }
    }),
    prisma.category.findMany({ 
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } }
      }
    })
  ]);

  // Group categories into subcategories
  const plantCats = categories.filter(c => /(Plants|Succulents|Herbal|Medicinal|Fruit|Fragrant|Bonsai)/i.test(c.name));
  const potCats = categories.filter(c => /(Pots|Planters)/i.test(c.name));
  const otherCats = categories.filter(c => !plantCats.includes(c) && !potCats.includes(c));

  return (
    <div className="min-h-screen section-bg-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HoldBanner />
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Our Accessories Collection</h1>
          <p className="text-gray-600">Curated jewelry and accessories for every occasion</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar: Categories & Filters */}
          <aside className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur border rounded-xl shadow-sm p-4 lg:sticky lg:top-24">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Categories</h2>
                <Link
                  href={`?${new URLSearchParams({ ...(sort ? { sort } : {}), ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${!categorySlug ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All
                </Link>
              </div>

              {/* Quick search */}
              <form method="GET" action="../search" className="mb-3">
                <input name="q" className="input h-9 w-full" placeholder="Search products..." />
              </form>

              {/* Filters */}
              <details open className="mb-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-800">Filters</summary>
                <div className="mt-3 space-y-3">
                  {/* In-stock toggle */}
                  <Link
                    href={`?${new URLSearchParams({ ...(categorySlug ? { category: categorySlug } : {}), ...(sort ? { sort } : {}), ...(inStockOnly ? {} : { inStock: '1' }), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`}
                    className={`chip-small ${inStockOnly ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {inStockOnly ? 'In Stock ✓' : 'In Stock only'}
                  </Link>

                  {/* Price range */}
                  <form method="GET" className="space-y-2">
                    <div className="flex gap-2">
                      <input type="number" name="min" placeholder="Min ₹" defaultValue={typeof min === 'number' && !Number.isNaN(min) ? min : ''} className="input h-9 w-full" />
                      <input type="number" name="max" placeholder="Max ₹" defaultValue={typeof max === 'number' && !Number.isNaN(max) ? max : ''} className="input h-9 w-full" />
                    </div>
                    {/* Preserve existing params */}
                    {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
                    {sort && <input type="hidden" name="sort" value={sort} />}
                    {inStockOnly && <input type="hidden" name="inStock" value="1" />}
                    <button type="submit" className="px-3 py-1.5 rounded-md text-sm bg-gray-800 text-white hover:bg-gray-700">Apply</button>
                  </form>
                </div>
              </details>

              {/* Grouped subcategories with scroll */}
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                <details open>
                  <summary className="cursor-pointer text-sm font-semibold text-gray-800">Plants</summary>
                  <nav className="mt-2 space-y-1">
                    {plantCats.map(cat => {
                      const isActive = categorySlug === cat.slug;
                      const href = `?${new URLSearchParams({ category: cat.slug, ...(sort ? { sort } : {}), ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`;
                      return (
                        <Link
                          key={cat.id}
                          href={href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          <span>{cat.name}</span>
                          {typeof cat._count?.products === 'number' && (
                            <span className={`text-xs ${isActive ? 'opacity-90' : 'text-gray-500'}`}>{cat._count.products}</span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </details>

                <details open>
                  <summary className="cursor-pointer text-sm font-semibold text-gray-800">Pots & Planters</summary>
                  <nav className="mt-2 space-y-1">
                    {potCats.map(cat => {
                      const isActive = categorySlug === cat.slug;
                      const href = `?${new URLSearchParams({ category: cat.slug, ...(sort ? { sort } : {}), ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`;
                      return (
                        <Link
                          key={cat.id}
                          href={href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          <span>{cat.name}</span>
                          {typeof cat._count?.products === 'number' && (
                            <span className={`text-xs ${isActive ? 'opacity-90' : 'text-gray-500'}`}>{cat._count.products}</span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </details>

                <details open>
                  <summary className="cursor-pointer text-sm font-semibold text-gray-800">Others</summary>
                  <nav className="mt-2 space-y-1">
                    {otherCats.map(cat => {
                      const isActive = categorySlug === cat.slug;
                      const href = `?${new URLSearchParams({ category: cat.slug, ...(sort ? { sort } : {}), ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`;
                      return (
                        <Link
                          key={cat.id}
                          href={href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                          <span>{cat.name}</span>
                          {typeof cat._count?.products === 'number' && (
                            <span className={`text-xs ${isActive ? 'opacity-90' : 'text-gray-500'}`}>{cat._count.products}</span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </details>
              </div>
            </div>
          </aside>

          {/* Main: Sort + Grid */}
          <section className="lg:col-span-9">
            {/* Sort bar */}
            <div className="bg-white rounded-xl border shadow-sm p-4 mb-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">{categorySlug ? `Category: ${categories.find(c => c.slug === categorySlug)?.name || 'All'}` : 'All Products'}{inStockOnly ? ' • In Stock' : ''}{typeof min === 'number' && !Number.isNaN(min) ? ` • Min ₹${min}` : ''}{typeof max === 'number' && !Number.isNaN(max) ? ` • Max ₹${max}` : ''}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort:</span>
                <div className="flex gap-2">
                  <Link className={`px-3 py-1.5 rounded-md text-sm transition-colors ${sort === 'new' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} href={`?${new URLSearchParams({ ...(categorySlug ? { category: categorySlug } : {}), sort: 'new', ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`}>
                    Newest
                  </Link>
                  <Link className={`px-3 py-1.5 rounded-md text-sm transition-colors ${sort === 'price-asc' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} href={`?${new URLSearchParams({ ...(categorySlug ? { category: categorySlug } : {}), sort: 'price-asc', ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`}>
                    Price ↑
                  </Link>
                  <Link className={`px-3 py-1.5 rounded-md text-sm transition-colors ${sort === 'price-desc' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} href={`?${new URLSearchParams({ ...(categorySlug ? { category: categorySlug } : {}), sort: 'price-desc', ...(inStockOnly ? { inStock: '1' } : {}), ...(typeof min === 'number' && !Number.isNaN(min) ? { min: String(min) } : {}), ...(typeof max === 'number' && !Number.isNaN(max) ? { max: String(max) } : {}), }).toString()}`}>
                    Price ↓
                  </Link>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map(p => (
                <Link key={p.id} href={`/${locale}/products/${p.slug}`} className="group">
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow card-hover">
                    <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative overflow-hidden">
                      <ProductImage
                        images={p.images}
                        name={p.name}
                        width={400}
                        height={400}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                      <div className="shine absolute inset-0"></div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-green-700 transition-colors">
                        {p.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-700">{formatINR(paiseToRupees(p.price))}</span>
                        <span className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                          {p.stock}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-500">Try adjusting your filters or browse all products</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


