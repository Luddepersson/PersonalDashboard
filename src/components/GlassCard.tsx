"use client";

import { useRef, useState, type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover3d?: boolean;
}

export default function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`glass ${className}`}>
      {children}
    </div>
  );
}
