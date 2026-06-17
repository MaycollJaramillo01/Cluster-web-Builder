"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wraps a section and fades/slides it in when it scrolls into view.
 * No-op (renders visible immediately) when `disabled` — used in the editor so
 * editing doesn't constantly re-trigger animations.
 */
export function Reveal({
  children,
  disabled = false,
  delay = 0,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled]);

  return (
    <div
      ref={ref}
      className={`site-reveal ${visible ? "is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
