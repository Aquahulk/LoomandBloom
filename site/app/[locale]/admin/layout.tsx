import Link from 'next/link';

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = `/${locale}/admin`;
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <div className="text-lg font-semibold">Admin</div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href={`${base}`}>Dashboard</Link>
          <Link href={`${base}/products`}>Products</Link>
          <Link href={`${base}/categories`}>Categories</Link>
          <Link href={`${base}/services`}>Services</Link>
          <Link href={`${base}/orders`}>Orders</Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}


