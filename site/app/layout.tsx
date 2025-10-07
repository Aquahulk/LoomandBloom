import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bharat Pushpam",
  description: "Plants, planters, and garden services.",
};
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/** Wrap with client providers for global UI (e.g., toasts) */}
        {/** eslint-disable-next-line @next/next/no-sync-scripts */}
        {/* Client providers are safe to include inside server layout */}
        {/* Inject global ToastProvider */}
        <ToastProvider>
          {children}
        </ToastProvider>
        {/* Global bottom dark green blurred glow across pages */}
        <div aria-hidden className="fixed bottom-0 left-0 right-0 h-64 md:h-80 bg-gradient-to-t from-green-900/40 via-green-800/30 to-transparent blur-3xl pointer-events-none -z-10 print:hidden" />
     </body>
    </html>
  );
}
