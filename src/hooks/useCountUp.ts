import { useEffect, useRef, useState } from "react";

/**
 * Animated counter hook. Counts from 0 → target when the element
 * becomes visible (IntersectionObserver), like Jumia / BeniTech.
 */
export function useCountUp(target: number, durationMs = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;

    const animate = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const from = 0;
      const to = Number.isFinite(target) ? target : 0;

      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(from + (to - from) * eased));
        if (t < 1) requestAnimationFrame(tick);
        else setValue(to);
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [target, durationMs]);

  return { value, ref };
}
