"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoreBadge } from "./StoreBadge";
import { IconRain } from "./IconRain";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const t = useTranslations("hero");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Entrance animations
      gsap.from(".hero__logo-container", {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2,
      });
      gsap.from(".hero__brand-name", {
        opacity: 0,
        x: -30,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.4,
      });
      gsap.from(".hero__tagline", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.6,
      });
      gsap.from(".hero__subtitle", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.8,
      });
      gsap.from(".hero__cta-label", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        delay: 1.0,
      });
      gsap.from(".store-badge-image-btn", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.15,
        ease: "power3.out",
        delay: 1.2,
      });

      // Scroll transitions: Fade green backdrop and color transition text
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      timeline.to(".hero__green-bg", {
        opacity: 0,
        ease: "none",
      }, 0);

      timeline.to([".hero__brand-name", ".hero__tagline", ".hero__cta-label"], {
        color: "#1a1a1a",
        ease: "none",
      }, 0);

      timeline.to(".hero__subtitle", {
        color: "#6b6f63",
        ease: "none",
      }, 0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="hero" ref={sectionRef}>
      {/* Green background with inverted icon rain */}
      <div className="hero__green-bg">
        <IconRain activeIndex={0} inverted />
      </div>

      <div className="hero__content-inner">
        <div className="hero__brand-row">
          <div className="hero__logo-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/willfolks_logo_complete.svg"
              alt="WillFolks"
              width={120}
              height={120}
              className="hero__logo-img"
            />
          </div>
          <h1 className="hero__brand-name">WillFolks</h1>
        </div>

        <p className="hero__tagline">&ldquo;{t("tagline")}&rdquo;</p>
        <p className="hero__subtitle">{t("subtitle")}</p>

        <p className="hero__cta-label">{t("cta")}</p>
        <div className="hero__badges">
          <StoreBadge store="googlePlay" />
          <StoreBadge store="appStore" />
          <StoreBadge store="github" />
        </div>
      </div>
    </section>
  );
}
