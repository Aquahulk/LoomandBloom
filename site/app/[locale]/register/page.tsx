"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import { useToast } from '@/app/components/Toast';

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  // Use React.use to unwrap the params Promise in client components
  const { locale } = use(params);
  const { showToast } = useToast();
  
  const [step, setStep] = useState(1); // 1: Registration form, 2: OTP verification
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [otpData, setOtpData] = useState({
    phoneOtp: '',
    userId: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOtpData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      showToast({ variant: 'error', title: 'Passwords do not match' });
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setOtpData(prev => ({
          ...prev,
          userId: data.userId
        }));
        setStep(2); // Move to OTP verification step
      } else {
        showToast({ variant: 'error', title: 'Registration failed', description: data.error || 'Please try again.' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast({ variant: 'error', title: 'Registration error', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpData.userId,
          phoneOtp: otpData.phoneOtp
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert('Registration successful!');
        // User is now verified and session cookie is set server-side.
        // Redirect directly to the localized homepage.
        router.replace(`/${locale}`);
        router.refresh();
      } else {
        showToast({ variant: 'error', title: 'OTP verification failed', description: data.error || 'Please try again.' });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast({ variant: 'error', title: 'OTP verification error', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    
    try {
      if (!otpData.userId) {
        showToast({ variant: 'error', title: 'Cannot resend OTP', description: 'Registration not found. Please submit the form again.' });
        return;
      }
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: otpData.userId,
          method: 'phone'
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        showToast({ variant: 'success', title: 'OTP resent', description: 'Check your phone' });
      } else {
        showToast({ variant: 'error', title: 'Failed to resend OTP', description: typeof data?.error === 'string' ? data.error : undefined });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showToast({ variant: 'error', title: 'Failed to resend OTP', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {step === 1 ? 'Create your account' : 'Verify your identity'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 1 ? (
            <>
              Already have an account?{' '}
              <Link href={`/${locale}/login`} className="font-medium text-green-600 hover:text-green-500">
                Sign in
              </Link>
            </>
          ) : (
            'Enter the OTP sent to your phone'
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Register'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleVerifyOtp}>
                <div>
                  <label htmlFor="phoneOtp" className="block text-sm font-medium text-gray-700">
                    Phone OTP
                  </label>
                  <div className="mt-1">
                    <input
                      id="phoneOtp"
                      name="phoneOtp"
                      type="text"
                      required
                      value={otpData.phoneOtp}
                      onChange={handleOtpInputChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      placeholder="Enter OTP sent to your phone"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </form>

              <div className="text-sm text-center">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}