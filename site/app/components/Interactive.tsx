"use client";

import React, { useEffect, useRef, useState } from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode };

export function Reveal({ children, className = '' }: DivProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? 'reveal-in' : ''} ${className}`}>{children}</div>
  );
}

export function Tilt({ children, className = '', max = 8 }: DivProps & { max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -max; // rotateX
      const ry = ((x - cx) / cx) * max;  // rotateY
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const reset = () => { el.style.transform = 'rotateX(0deg) rotateY(0deg)'; };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', reset);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', reset);
    };
  }, [max]);
  return (
    <div ref={ref} className={`tilt-base ${className}`}>{children}</div>
  );
}

export function Parallax({ children, className = '', speed = 0.15 }: DivProps & { speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const baseY = el.offsetTop;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const offset = (y - baseY) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={`parallax-base ${className}`}>{children}</div>
  );
}