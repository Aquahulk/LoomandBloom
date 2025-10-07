// Ambient declaration for Razorpay injected by checkout script
// Ensures TypeScript recognizes `window.Razorpay` in client components

declare global {
  interface Window {
    Razorpay: any;
  }
}

export {};