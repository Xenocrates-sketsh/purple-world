import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fades content up the first time it scrolls into view.
 * `delay` staggers siblings (e.g. timeline cards).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(visible ? "animate-fade-in-up" : "opacity-0", className)}
    >
      {children}
    </div>
  );
}
