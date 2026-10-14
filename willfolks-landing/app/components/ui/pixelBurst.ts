import { animate, stagger, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Sprays a handful of square "pixels" out of an element, then cleans up.
 * Used as click feedback on calls to action.
 */
export function pixelBurst(origin: HTMLElement, count = 18) {
  if (prefersReducedMotion()) return;

  const rect = origin.getBoundingClientRect();
  const host = document.createElement("div");
  host.className = "pixel-burst";
  host.style.left = `${rect.left + rect.width / 2}px`;
  host.style.top = `${rect.top + rect.height / 2}px`;
  document.body.appendChild(host);

  const pieces = Array.from({ length: count }, () => {
    const piece = document.createElement("i");
    const size = utils.random(4, 11);
    piece.style.width = piece.style.height = `${size}px`;
    host.appendChild(piece);
    return piece;
  });

  animate(pieces, {
    x: () => utils.random(-rect.width * 0.9, rect.width * 0.9),
    y: () => utils.random(-150, 60),
    rotate: () => utils.random(-220, 220),
    scale: [{ to: [0, 1], duration: 110 }, { to: 0, duration: 760 }],
    duration: 870,
    delay: stagger(7),
    ease: "outExpo",
    onComplete: () => host.remove(),
  });
}
