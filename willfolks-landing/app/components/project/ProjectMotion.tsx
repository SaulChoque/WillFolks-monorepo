"use client";

import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
import { prefersReducedMotion, revealOnScroll } from "@/lib/motion";

interface ProjectMotionProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Shared choreography for the project pages: the head strip slides in, the
 * title rises word by word and every `.reveal` group fades up as it scrolls
 * into view. The markup stays server-rendered; this only animates it.
 */
export function ProjectMotion({ className, children }: ProjectMotionProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      revealOnScroll(".sec-head > *", { y: 0, x: -18, each: 60, enter: "bottom top" });
      revealOnScroll(".proj__lede, .proj__switch > *", { each: 50, delay: 350, enter: "bottom top" });
      root.querySelectorAll(".reveal").forEach((group) => {
        revealOnScroll(Array.from(group.children) as HTMLElement[], { trigger: group, each: 80 });
      });

      if (prefersReducedMotion()) return;

      animate(".proj__title .w__in", {
        y: ["105%", "0%"],
        duration: 1000,
        delay: stagger(70, { start: 150 }),
        ease: "outExpo",
      });
      animate(".proj__spin", { rotate: 360, duration: 26000, ease: "linear", loop: true });
    });

    return () => scope.revert();
  }, []);

  return (
    <main className={className} ref={rootRef}>
      {children}
    </main>
  );
}
