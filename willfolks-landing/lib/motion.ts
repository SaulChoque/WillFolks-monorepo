import { animate, onScroll, stagger, utils } from "animejs";
import type { DOMTargetsParam } from "animejs";

export const EASE_OUT = "outExpo";
export const EASE_SNAP = "outQuart";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function isCoarsePointer(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

interface RevealOptions {
  /** Element whose scroll position triggers the reveal. Defaults to the first target. */
  trigger?: Element | null;
  y?: number;
  x?: number;
  duration?: number;
  delay?: number;
  each?: number;
  /** Container/target threshold, e.g. "bottom-=12% top". */
  enter?: string;
}

/**
 * Fade + slide a group of elements in the first time they scroll into view.
 * Must be called inside an anime `createScope` so it is reverted on unmount.
 */
export function revealOnScroll(targets: DOMTargetsParam, options: RevealOptions = {}) {
  const {
    trigger,
    y = 28,
    x = 0,
    duration = 900,
    delay = 0,
    each = 70,
    enter = "bottom-=12% top",
  } = options;

  const els = utils.$(targets);
  if (!els.length) return null;

  if (prefersReducedMotion()) {
    utils.set(els, { opacity: 1 });
    return null;
  }

  utils.set(els, { opacity: 0 });

  return animate(els, {
    opacity: [0, 1],
    y: [y, 0],
    x: [x, 0],
    duration,
    delay: stagger(each, { start: delay }),
    ease: EASE_OUT,
    autoplay: onScroll({
      target: (trigger as HTMLElement) ?? els[0],
      enter,
    }),
  });
}

/**
 * Tie an element's vertical offset to scroll progress through `trigger`.
 * `speed` > 0 moves with the scroll (slower than content), < 0 against it.
 */
export function parallax(
  targets: DOMTargetsParam,
  trigger: Element,
  speed: number,
  extra: Record<string, [number, number]> = {},
) {
  if (prefersReducedMotion()) return null;
  const distance = speed * 100;
  return animate(targets, {
    y: [`${distance}px`, `${-distance}px`],
    ...extra,
    ease: "linear",
    autoplay: onScroll({
      target: trigger as HTMLElement,
      enter: "bottom top",
      leave: "top bottom",
      sync: 0.35,
    }),
  });
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
