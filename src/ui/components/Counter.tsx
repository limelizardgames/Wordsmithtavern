import { useEffect, useRef, useState } from 'preact/hooks';

/** A number that counts up (or down) smoothly to its new value. */
export function useTween(value: number, duration = 600): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const frame = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    cancelAnimationFrame(frame.current);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(origin + (value - origin) * eased);
      from.current = v;
      setShown(v);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);
  return shown;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}
