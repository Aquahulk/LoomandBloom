"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: { name: string };
};

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    searchParams.then(params => {
      setQuery(params.q || '');
    });
  }, [searchParams]);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (e) {
      console.error('Search failed:', e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) search(query);
  }, [query]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Search Products</h1>
      
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for plants, pots, accessories..."
          className="w-full px-4 py-3 border rounded-lg text-lg"
        />
      </div>

      {loading && <div className="text-center py-8">Searching...</div>}
      
      {!loading && query && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
          </div>
          
          {results.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found. Try different keywords.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(product => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.slug}`}
                  className="border rounded p-4 hover:shadow transition"
                >
                  <h3 className="font-medium mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.category.name}</p>
                  <p className="text-lg font-medium">{formatINR(paiseToRupees(product.price))}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
