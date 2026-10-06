"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { animate, stagger } from "animejs";
import { setLocale } from "../actions";
import { LOCALES, type Locale } from "@/lib/site";
import { prefersReducedMotion } from "@/lib/motion";
import { LogoMark } from "./ui/LogoMark";
import { TransitionLink } from "./ui/TransitionLink";
import { useLenis } from "./providers/LenisProvider";
import { usePageTransition } from "./providers/TransitionProvider";

const SECTIONS = ["how", "features", "demo", "faq"] as const;

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const lenis = useLenis();
  const { behindCurtain } = usePageTransition();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide while reading down, bring back on the first scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > lastScrollY.current && y > 160);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock the page behind it and stagger the links in.
  useEffect(() => {
    const instance = lenis.current;
    if (!open) return;
    instance?.stop();
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const links = menuRef.current?.querySelectorAll(".nav__menu-link, .nav__menu-foot");
    const intro =
      links && !prefersReducedMotion()
        ? animate(links, {
            opacity: [0, 1],
            x: [-28, 0],
            duration: 520,
            delay: stagger(55, { start: 80 }),
            ease: "outExpo",
          })
        : null;

    return () => {
      instance?.start();
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      intro?.revert();
    };
  }, [open, lenis]);

  const switchLocale = (next: Locale) => {
    if (next === locale) return;
    setOpen(false);
    void behindCurtain(`LANG:${next}`, () => setLocale(next));
  };

  const langSwitch = (
    <div className="nav__lang" role="group" aria-label={t("language")}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className="nav__lang-btn"
          aria-pressed={code === locale}
          lang={code}
          onClick={() => switchLocale(code)}
        >
          {code}
        </button>
      ))}
    </div>
  );

  return (
    <header
      className={`nav ${hidden && !open ? "nav--hidden" : ""} ${open ? "nav--open" : ""}`}
      id="navbar"
    >
      <div className="nav__bar">
        <TransitionLink href="/" className="nav__brand" aria-label={t("homeLabel")}>
          <LogoMark className="nav__mark" />
          <span className="nav__word">{t("brand")}</span>
        </TransitionLink>

        <nav className="nav__links" aria-label={t("mainLabel")}>
          {SECTIONS.map((id, i) => (
            <TransitionLink key={id} href={`/#${id}`} className="nav__link">
              <span className="nav__link-idx" aria-hidden="true">
                0{i + 1}
              </span>
              {t(id)}
            </TransitionLink>
          ))}
        </nav>

        <div className="nav__tools">
          {langSwitch}
          <TransitionLink href="/#download" className="nav__cta">
            {t("download")}
            <span aria-hidden="true">↓</span>
          </TransitionLink>
          <button
            type="button"
            className="nav__burger"
            aria-expanded={open}
            aria-controls="nav-menu"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="nav__menu" id="nav-menu" ref={menuRef} hidden={!open}>
        <nav className="nav__menu-links" aria-label={t("mainLabel")}>
          {[...SECTIONS, "download" as const].map((id, i) => (
            <TransitionLink
              key={id}
              href={`/#${id}`}
              className="nav__menu-link"
              onClick={() => setOpen(false)}
            >
              <span className="mono" aria-hidden="true">
                0{i + 1}
              </span>
              {t(id)}
            </TransitionLink>
          ))}
        </nav>
        <div className="nav__menu-foot mono">
          <TransitionLink href="/social" onClick={() => setOpen(false)}>
            {t("social")}
          </TransitionLink>
          <TransitionLink href="/terms" onClick={() => setOpen(false)}>
            {t("terms")}
          </TransitionLink>
          <TransitionLink href="/privacy" onClick={() => setOpen(false)}>
            {t("privacy")}
          </TransitionLink>
        </div>
      </div>
    </header>
  );
}
