"use client";

export function triggerConfetti(target: HTMLElement | null) {
  if (!target || typeof window === "undefined" || typeof document === "undefined") return;
  const rect = target.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  const colors = ["#22c55e", "#16a34a", "#10b981", "#84cc16", "#65a30d", "#34d399"]; 
  const count = 28;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement("span");
    const dx = (Math.random() * 240 - 120).toFixed(1); // -120 .. 120
    const dy = (Math.random() * -200 - 40).toFixed(1); // upward burst
    const rot = Math.floor(Math.random() * 720) + "deg";
    const dur = Math.floor(Math.random() * 600) + 800; // 800..1400ms
    const scale = (Math.random() * 0.6 + 0.8).toFixed(2);
    const color = colors[Math.floor(Math.random() * colors.length)];

    particle.className = "confetti-particle";
    particle.style.setProperty("--x", `${originX}px`);
    particle.style.setProperty("--y", `${originY}px`);
    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);
    particle.style.setProperty("--rot", rot);
    particle.style.setProperty("--dur", `${dur}ms`);
    particle.style.setProperty("--scale", `${scale}`);
    particle.style.setProperty("--color", color);

    document.body.appendChild(particle);
    window.setTimeout(() => {
      try { document.body.removeChild(particle); } catch {}
    }, dur + 100);
  }
}

export default triggerConfetti;