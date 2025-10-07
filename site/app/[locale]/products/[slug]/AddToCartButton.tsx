"use client";
import { useRef, useState } from 'react';
import { triggerConfetti } from '@/app/components/ConfettiBurst';

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function AddToCartButton({ product }: { product: Product }) {
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const addToCart = () => {
    if (typeof window !== 'undefined') {
      setLoading(true);
      const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      console.log('Current cart before adding:', cart);
      
      const existing = cart.find((item) => item.id === product.id);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        });
      }
      
      console.log('Cart after adding item:', cart);
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('Saved to localStorage:', localStorage.getItem('cart'));
      
      // Update cart count in header
      const cartCount = cart.reduce((sum: number, item) => sum + item.quantity, 0);
      const cartCountElement = document.getElementById('cart-count');
      if (cartCountElement) {
        cartCountElement.textContent = cartCount.toString();
      }
      
      try { triggerConfetti(btnRef.current); } catch {}
      alert('Added to cart!');
      setLoading(false);
    }
  };

  return (
    <button 
      ref={btnRef}
      onClick={addToCart}
      disabled={product.stock === 0 || loading}
      className="w-full py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      <div className="flex items-center justify-center space-x-1">
        {loading ? (
          <>
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Adding...</span>
          </>
        ) : product.stock === 0 ? (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-xs">Out of Stock</span>
          </>
        ) : (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span className="text-xs">Add to Cart</span>
          </>
        )}
      </div>
    </button>
  );
}
