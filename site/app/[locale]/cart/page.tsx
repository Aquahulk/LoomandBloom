"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { triggerConfetti } from '@/app/components/ConfettiBurst';
import { formatINR, paiseToRupees } from '@/app/lib/currency';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [checkoutSettings, setCheckoutSettings] = useState<{ freeDeliveryThreshold: number; deliveryFee: number; taxPercent?: number }>({ freeDeliveryThreshold: 99900, deliveryFee: 5000, taxPercent: 0 });

  useEffect(() => {
    // Load cart from localStorage only on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart');
      console.log('Raw cart data from localStorage:', saved);
      if (saved) {
        try {
          const parsedCart = JSON.parse(saved);
          console.log('Parsed cart data:', parsedCart);
          setCart(parsedCart);
        } catch (e) {
          console.error('Error parsing cart:', e);
          setCart([]);
        }
      } else {
        console.log('No cart data found in localStorage');
        setCart([]);
      }
      setInitialized(true);
    }
  }, []);

  // Load Razorpay script
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
      };
      document.head.appendChild(script);

      return () => {
        // Cleanup script on unmount
        document.head.removeChild(script);
      };
    }
  }, []);

  // Load public settings for checkout (free delivery threshold and delivery fee)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data?.checkout) {
          setCheckoutSettings({
            freeDeliveryThreshold: data.checkout.freeDeliveryThreshold ?? 99900,
            deliveryFee: data.checkout.deliveryFee ?? 5000,
            taxPercent: data?.invoice?.taxPercent ?? 0,
          });
        }
      } catch (e) {
        console.warn('Failed to load settings, using defaults');
      }
    })();
  }, []);

  const updateQuantity = (id: string, quantity: number) => {
    let newCart;
    if (quantity <= 0) {
      newCart = cart.filter(item => item.id !== id);
    } else {
      newCart = cart.map(item => item.id === id ? { ...item, quantity } : item);
    }
    setCart(newCart);
    
    // Update localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(newCart));
      // Update cart count in header
      const cartCount = newCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const cartCountElement = document.getElementById('cart-count');
      if (cartCountElement) {
        cartCountElement.textContent = cartCount.toString();
      }
    }
  };

  const removeItem = (id: string) => {
    const newCart = cart.filter(item => item.id !== id);
    setCart(newCart);
    
    // Update localStorage immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(newCart));
      // Update cart count in header
      const cartCount = newCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const cartCountElement = document.getElementById('cart-count');
      if (cartCountElement) {
        cartCountElement.textContent = cartCount.toString();
      }
    }
  };

  const totalPaise = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const freeDelivery = totalPaise >= checkoutSettings.freeDeliveryThreshold; // threshold from settings
  const shippingFeePaise = freeDelivery ? 0 : (checkoutSettings.deliveryFee || 0);
  const taxPercent = Math.max(0, Math.floor(checkoutSettings.taxPercent || 0));
  const taxAmountPaise = Math.floor(totalPaise * taxPercent / 100);

  useEffect(() => {
    // Save cart to localStorage only on client side and only after initialization
    if (typeof window !== 'undefined' && initialized) {
      localStorage.setItem('cart', JSON.stringify(cart));
      console.log('Saved cart to localStorage:', cart);
    }
  }, [cart, initialized]);

  // State for customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });
  
  // State to track if the checkout form is shown
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const initiateCheckout = () => {
    setShowCheckoutForm(true);
  };
  
  const checkout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    try {
      // Check if Razorpay is available
      if (typeof window === 'undefined' || !(window as any).Razorpay || !razorpayLoaded) {
        throw new Error('Razorpay not loaded. Please wait a moment and try again.');
      }

      // Validate required fields
      if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare secure order data
      const orderData = {
        amount: totalPaise + taxAmountPaise + shippingFeePaise, // include tax and shipping in amount
        currency: 'INR',
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price // Already in paise
        })),
        shippingFee: shippingFeePaise,
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          pincode: customerInfo.pincode
        }
      };

      const res = await fetch('/api/checkout/order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!data.order) throw new Error(data.error || 'Order failed');

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID as string;
      if (!keyId) {
        throw new Error('Payment configuration missing. Set NEXT_PUBLIC_RAZORPAY_KEY_ID');
      }

      const options = {
        key: keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Bharat Pushpam',
        description: `Order for ${cart.length} items`,
        order_id: data.order.id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.phone
        },
        notes: {
          address: customerInfo.address,
          city: customerInfo.city,
          pincode: customerInfo.pincode
        },
        handler: function (response: any) {
          // Send payment verification to server
          verifyPayment(response, data.order.id);
        }
      } as any;

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      // Provide detailed failure info to help diagnose issues
      rzp.on('payment.failed', function (response: any) {
        const err = response?.error || {};
        const details = [
          err.code && `Code: ${err.code}`,
          err.reason && `Reason: ${err.reason}`,
          err.description && `Description: ${err.description}`
        ].filter(Boolean).join('\n');
        alert(`Payment failed. ${details || ''}`.trim());
      });
      rzp.open();
    } catch (e: any) {
      alert(e.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to verify payment with server
  const verifyPayment = async (paymentResponse: any, orderId: string) => {
    try {
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Payment successful!');
        setCart([]);
        // Clear localStorage and update cart count
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cart');
          const cartCountElement = document.getElementById('cart-count');
          if (cartCountElement) {
            cartCountElement.textContent = '0';
          }
        }
      } else {
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        
        
        
        {cart.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link href="/products" className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">{formatINR(paiseToRupees(item.price))} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={(e) => { 
                        updateQuantity(item.id, item.quantity + 1);
                        try { triggerConfetti(e.currentTarget as HTMLElement); } catch {}
                      }}
                      className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                  <div className="font-semibold text-gray-900">{formatINR(paiseToRupees(item.price * item.quantity))}</div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total: {formatINR(paiseToRupees(totalPaise + taxAmountPaise + shippingFeePaise))}</span>
                {freeDelivery ? (
                  <span className="text-green-600 text-sm font-medium">✓ Free delivery</span>
                ) : (
                  <span className="text-gray-500 text-sm">Add {formatINR(paiseToRupees(Math.max(0, checkoutSettings.freeDeliveryThreshold - totalPaise)))} more for free delivery</span>
                )}
              </div>
              {taxPercent > 0 && (
                <div className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>Tax ({taxPercent}%)</span>
                  <span>{formatINR(paiseToRupees(taxAmountPaise))}</span>
                </div>
              )}
              {!freeDelivery && (
                <div className="flex justify-between text-sm text-gray-700 mb-2">
                  <span>Delivery Fee</span>
                  <span>{formatINR(paiseToRupees(shippingFeePaise))}</span>
                </div>
              )}
              {!showCheckoutForm ? (
                <button
                  onClick={initiateCheckout}
                  disabled={loading || !razorpayLoaded}
                  className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {!razorpayLoaded ? 'Loading Payment...' : 'Proceed to Checkout'}
                </button>
              ) : (
                <form onSubmit={checkout} className="space-y-4 mt-4 border-t pt-4">
                  <h3 className="font-medium text-lg">Shipping Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={customerInfo.name}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={customerInfo.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        name="email"
                        value={customerInfo.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                        placeholder="Your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={customerInfo.pincode}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="6-digit pincode"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Full Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={customerInfo.address}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="House/Flat No., Building, Street, Area"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">City *</label>
                      <input
                        type="text"
                        name="city"
                        value={customerInfo.city}
                        onChange={handleInputChange}
                        required
                        className="w-full p-2 border rounded-md"
                        placeholder="Your city"
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Processing...' : 'Pay Now'}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
