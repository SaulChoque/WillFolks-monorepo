"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, createScope, stagger } from "animejs";
import {
  FaDiscord,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import { SOCIAL_LINKS, type SocialId } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/motion";
import { useSnackbar } from "./providers/SnackbarProvider";
import { pixelBurst } from "./ui/pixelBurst";

const ICONS: Record<SocialId, IconType> = {
  github: FaGithub,
  x: FaXTwitter,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  linkedin: FaLinkedinIn,
  discord: FaDiscord,
};

export function SocialGrid() {
  const t = useTranslations("social");
  const { showSnackbar } = useSnackbar();
  const rootRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const scope = createScope({ root }).add(() => {
      animate(".net", {
        opacity: [0, 1],
        y: [50, 0],
        duration: 900,
        delay: stagger(80, { start: 500 }),
        ease: "outExpo",
      });
    });

    // Each icon turns once on its own axis when its card is hovered.
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".net"));
    const spins = cards.map((card) => {
      const icon = card.querySelector(".net__icon");
      const onEnter = () => {
        if (icon) animate(icon, { rotateY: [0, 360], duration: 800, ease: "outExpo" });
      };
      card.addEventListener("pointerenter", onEnter);
      return () => card.removeEventListener("pointerenter", onEnter);
    });

    return () => {
      spins.forEach((off) => off());
      scope.revert();
    };
  }, []);

  return (
    <ul className="social__grid" ref={rootRef}>
      {SOCIAL_LINKS.map((link, i) => {
        const Icon = ICONS[link.id];
        const inner = (
          <>
            <span className="net__idx mono" aria-hidden="true">
              .0{i + 1}
            </span>
            <Icon className="net__icon" aria-hidden="true" />
            <span className="net__name">{link.label}</span>
            <span className="net__handle mono">
              {link.href ? (link.handle ?? t("open")) : t("soon")}
            </span>
            <span className="net__go" aria-hidden="true">
              {link.href ? "↗" : "…"}
            </span>
          </>
        );

        return (
          <li key={link.id}>
            {link.href ? (
              <a
                className="net net--live hud"
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <button
                type="button"
                className="net hud"
                onClick={(event) => {
                  pixelBurst(event.currentTarget, 12);
                  showSnackbar(t("soonToast", { network: link.label }));
                }}
              >
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
