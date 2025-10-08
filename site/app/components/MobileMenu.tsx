"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function MobileMenu({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center space-x-1 px-3 py-1.5 bg-white text-green-800 rounded-md border border-green-700 hover:bg-emerald-50 transition-colors"
      >
        {/* Ellipsis icon (three dots) */}
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="10" r="2" />
          <circle cx="10" cy="10" r="2" />
          <circle cx="16" cy="10" r="2" />
        </svg>
        <span className="text-xs font-medium">Menu</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border border-green-700 bg-white shadow-lg z-50">
          <div className="py-2">
            <Link href={`/${locale}/products`} prefetch={false} className="block px-3 py-2 text-sm text-green-800 hover:bg-emerald-50">
              Products
            </Link>
            <Link href={`/${locale}/services`} prefetch={false} className="block px-3 py-2 text-sm text-green-800 hover:bg-emerald-50">
              Services
            </Link>
            <Link href={`/${locale}/account/orders`} prefetch={false} className="block px-3 py-2 text-sm text-green-800 hover:bg-emerald-50">
              My Orders
            </Link>
            <Link href={`/${locale}/about`} prefetch={false} className="block px-3 py-2 text-sm text-green-800 hover:bg-emerald-50">
              About
            </Link>
            <Link href={`/${locale}/contact`} prefetch={false} className="block px-3 py-2 text-sm text-green-800 hover:bg-emerald-50">
              Contact
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}