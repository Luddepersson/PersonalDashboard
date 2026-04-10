"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 600,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const mountedRef = useRef(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  const animate = useCallback(
    (from: number, to: number) => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      startTimeRef.current = null;

      function step(timestamp: number) {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const current = from + (to - from) * easedProgress;

        setDisplayValue(current);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(step);
        } else {
          setDisplayValue(to);
          animationRef.current = null;
        }
      }

      animationRef.current = requestAnimationFrame(step);
    },
    [duration]
  );

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      animate(0, value);
      previousValue.current = value;
      return;
    }

    if (value !== previousValue.current) {
      // Add pulse animation class
      if (spanRef.current) {
        spanRef.current.classList.remove("animate-data-pulse");
        // Force reflow
        void spanRef.current.offsetWidth;
        spanRef.current.classList.add("animate-data-pulse");
      }
      animate(previousValue.current, value);
      previousValue.current = value;
    }
  }, [value, animate]);

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const isInteger = Number.isInteger(value);
  const formatted = isInteger
    ? Math.round(displayValue).toLocaleString("sv-SE")
    : displayValue.toFixed(1);

  return (
    <span ref={spanRef} className="tabular-nums inline-block">
      {prefix}{formatted}{suffix}
    </span>
  );
}
