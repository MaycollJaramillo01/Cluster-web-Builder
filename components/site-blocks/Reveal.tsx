"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { MotionStyle } from "@/lib/site/design";

export function Reveal({
  children,
  disabled = false,
  delay = 0,
  motion = "subtle",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  delay?: number;
  motion?: MotionStyle;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (disabled) return;
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "0px 0px -10%", threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <div
      ref={ref}
      className={`site-reveal site-reveal-${motion}${visible || disabled ? " is-visible" : ""}`}
      style={{ "--reveal-delay": `${Math.min(delay, 280)}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
