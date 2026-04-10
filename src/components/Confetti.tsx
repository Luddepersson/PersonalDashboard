"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const ICE_COLORS = ["#2e94be", "#4cb4d8", "#6aafc8", "#ffffff"];

export function triggerConfetti() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.7 },
    colors: ICE_COLORS,
  });
}

interface ConfettiTriggerProps {
  condition: boolean;
}

export function ConfettiTrigger({ condition }: ConfettiTriggerProps) {
  const prevRef = useRef(false);

  useEffect(() => {
    if (condition && !prevRef.current) {
      triggerConfetti();
    }
    prevRef.current = condition;
  }, [condition]);

  return null;
}
