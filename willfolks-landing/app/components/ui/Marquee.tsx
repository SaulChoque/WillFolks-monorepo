"use client";

import { useEffect, useRef } from "react";
import { animate } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import { LogoMark } from "./LogoMark";

interface MarqueeProps {
  items: string[];
  /** Milliseconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  className?: string;
}

export function Marquee({ items, duration = 32000, reverse = false, className }: MarqueeProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    const loop = animate(track, {
      x: reverse ? ["-50%", "0%"] : ["0%", "-50%"],
      duration,
      ease: "linear",
      loop: true,
    });
    return () => {
      loop.revert();
    };
  }, [duration, reverse]);

  // Each group repeats the list so a single group always outruns the viewport.
  const group = (hidden: boolean) => (
    <div className="marquee__group" aria-hidden={hidden || undefined}>
      {[0, 1, 2].flatMap((round) =>
        items.map((item) => (
          <span className="marquee__item" key={`${round}-${item}`}>
            {item}
            <LogoMark />
          </span>
        )),
      )}
    </div>
  );

  return (
    <div className={`marquee ${className ?? ""}`}>
      <div className="marquee__track" ref={trackRef}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
