"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { StoreBadge } from "./StoreBadge";

gsap.registerPlugin(ScrollTrigger);

export function DownloadSection() {
  const t = useTranslations("download");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from(".download-section__logo", {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
        },
        opacity: 0,
        scale: 0.8,
        duration: 0.7,
        ease: "power3.out",
      });

      gsap.from(".download-section__title", {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
        },
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.2,
      });

      gsap.from(".download-section__badges .store-badge-image-btn", {
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
        },
        opacity: 0,
        y: 20,
        stagger: 0.15,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.4,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="download-section" id="download" ref={sectionRef}>
      <div className="download-section__logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/willfolks_logo_complete.svg"
          alt="WillFolks"
          width={140}
          height={140}
        />
      </div>
      <h2 className="download-section__title">{t("title")}</h2>
      <div className="download-section__badges">
        <StoreBadge store="googlePlay" />
        <StoreBadge store="appStore" />
        <StoreBadge store="github" />
      </div>
    </section>
  );
}
