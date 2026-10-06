"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, createScope, onScroll, stagger } from "animejs";
import { SITE, SOCIAL_LINKS } from "@/lib/site";
import { prefersReducedMotion, revealOnScroll } from "@/lib/motion";
import { LogoMark } from "./ui/LogoMark";
import { Marquee } from "./ui/Marquee";
import { TransitionLink } from "./ui/TransitionLink";

const SECTIONS = ["how", "features", "demo", "download", "faq"] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("navbar");
  const rootRef = useRef<HTMLElement>(null);
  const github = SOCIAL_LINKS.find((link) => link.id === "github");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      revealOnScroll(".footer__col", { trigger: root.querySelector(".footer__cols"), each: 70 });
      if (prefersReducedMotion()) return;

      // The wordmark rises letter by letter as the page bottoms out.
      animate(".footer__word span", {
        y: ["100%", "0%"],
        duration: 1100,
        delay: stagger(45),
        ease: "outExpo",
        autoplay: onScroll({ target: ".footer__word", enter: "bottom-=5% top" }),
      });
      animate(".footer__mark", { rotate: [-8, 8], duration: 2600, ease: "inOutSine", loop: true, alternate: true });
    });

    return () => scope.revert();
  }, []);

  return (
    <footer className="footer sec--acid" id="footer" ref={rootRef}>
      <Marquee items={t.raw("ticker") as string[]} reverse duration={38000} />

      <div className="footer__inner wrap">
        <div className="footer__cols">
          <div className="footer__col footer__brand">
            <LogoMark className="footer__mark" />
            <p>{t("tagline")}</p>
          </div>

          <nav className="footer__col" aria-label={t("explore")}>
            <h2 className="mono">{t("explore")}</h2>
            <ul>
              {SECTIONS.map((id) => (
                <li key={id}>
                  <TransitionLink href={`/#${id}`}>{tNav(id)}</TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer__col" aria-label={t("socialTitle")}>
            <h2 className="mono">{t("socialTitle")}</h2>
            <ul>
              <li>
                <TransitionLink href="/social">{t("allSocial")}</TransitionLink>
              </li>
              {github?.href ? (
                <li>
                  <a href={github.href} target="_blank" rel="noopener noreferrer">
                    {github.label} ↗
                  </a>
                </li>
              ) : null}
            </ul>
          </nav>

          <nav className="footer__col" aria-label={t("legalTitle")}>
            <h2 className="mono">{t("legalTitle")}</h2>
            <ul>
              <li>
                <TransitionLink href="/terms">{t("terms")}</TransitionLink>
              </li>
              <li>
                <TransitionLink href="/privacy">{t("privacy")}</TransitionLink>
              </li>
            </ul>
          </nav>

          <div className="footer__col">
            <h2 className="mono">{t("contactTitle")}</h2>
            <ul>
              <li>
                <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <p className="footer__word" aria-hidden="true">
          {SITE.name.split("").map((letter, i) => (
            <span key={i}>{letter}</span>
          ))}
        </p>

        <div className="footer__bottom mono">
          <span>
            © {SITE.year} {SITE.copyrightHolder}
          </span>
          <span>— {t("end")}</span>
          <span>{t("number")}</span>
        </div>
      </div>
    </footer>
  );
}
