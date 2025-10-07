"use client";

import { useEffect, useState } from 'react';

type Props = {
  src?: string;
  poster?: string;
  opacity?: number;
};

export default function HeroVideoOverlay({
  src = 'https://video.wixstatic.com/video/11062b_d578b9d4ffba48c68d086ec29fe9e6f0/720p/mp4/file.mp4',
  poster = '/plant-background.jpg',
  // Slightly higher opacity for a darker overall look
  opacity = 0.30,
}: Props) {
  const [enabled, setEnabled] = useState(true);

  // Respect user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setEnabled(false);
    const handler = (e: MediaQueryListEvent) => setEnabled(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!enabled) return null;

  return (
    // Hide on very small screens to keep content readable
    <div aria-hidden className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
      <video
        className="w-full h-full object-cover mix-blend-soft-light"
        playsInline
        autoPlay
        muted
        loop
        poster={poster}
        src={src}
        style={{ opacity }}
      />
      {/* Darker gradient to deepen contrast behind hero text */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-transparent md:from-black/50 md:via-black/30" />
    </div>
  );
}