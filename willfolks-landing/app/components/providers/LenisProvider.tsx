"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { RefObject } from "react";
import Lenis from "lenis";
import { prefersReducedMotion } from "@/lib/motion";

const LenisContext = createContext<RefObject<Lenis | null>>({ current: null });

/** Ref to the active Lenis instance (null when smooth scroll is disabled). */
export function useLenis() {
  return useContext(LenisContext);
}

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Native scrolling is the accessible default; only smooth it when allowed.
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      autoRaf: true,
    });
    lenisRef.current = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>
  );
}
