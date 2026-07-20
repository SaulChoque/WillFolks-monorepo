"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export function Navbar() {
  const t = useTranslations("navbar");
  const locale = useLocale();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [isHeroInverted, setIsHeroInverted] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      
      // Hide on scroll down, show on scroll up
      if (currentY > lastScrollY.current && currentY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      // Invert style near the top
      if (currentY > 80) {
        setIsHeroInverted(false);
      } else {
        setIsHeroInverted(true);
      }
      
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger on load
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLocale = async () => {
    const newLocale = locale === "en" ? "es" : "en";
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  return (
    <nav
      className={`navbar ${hidden ? "navbar--hidden" : ""} ${isHeroInverted ? "navbar--inverted" : ""}`}
      id="navbar"
      role="navigation"
      aria-label="Main navigation"
    >
      <a href="#" className="navbar__logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/willfolks_logo_complete.svg"
          alt="WillFolks logo"
          className="navbar__logo-img"
        />
        <span className="navbar__logo-text">{t("brand")}</span>
      </a>

      <div className="navbar__actions">
        <div className="navbar__nav-links">
          <a href="#hero" className="navbar__nav-link">
            {t("home")}
          </a>
          <a href="#features" className="navbar__nav-link">
            {t("features")}
          </a>
          <a href="#download" className="navbar__nav-link">
            {t("download")}
          </a>
        </div>
        <button
          className="navbar__lang-toggle"
          onClick={toggleLocale}
          id="lang-toggle"
          aria-label={`Switch to ${locale === "en" ? "Spanish" : "English"}`}
        >
          {t("language")}
        </button>
      </div>
    </nav>
  );
}
