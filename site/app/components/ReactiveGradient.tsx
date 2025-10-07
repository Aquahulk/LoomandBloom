"use client";
import { useCallback, useState } from 'react';

export default function ReactiveGradient({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const [coords, setCoords] = useState<{ x: string; y: string }>({ x: '50%', y: '50%' });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCoords({ x: `${x.toFixed(1)}%`, y: `${y.toFixed(1)}%` });
  }, []);

  return (
    <div className={`reactive-gradient ${className}`} onMouseMove={onMove} style={{ ['--mx' as any]: coords.x, ['--my' as any]: coords.y }}>
      {children}
    </div>
  );
}