"use client";

import { useRef, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MdAccountBalance,
  MdAlarm,
  MdTimer,
  MdLocationOn,
  MdSmartToy,
  MdAccountBalanceWallet,
} from "react-icons/md";
import type { IconType } from "react-icons";
import { IconRain } from "./IconRain";
import { FeatureCard } from "./FeatureCard";

gsap.registerPlugin(ScrollTrigger);

// Screenshots mapped to each section
const SCREENSHOTS = [
  "/screenshots/Screenshot_fallback.png",      // Escrow & Yield (fallback/home)
  "/screenshots/Screenshot_1784431845.png",     // Alarms
  "/screenshots/Screenshot_1784432207.png",     // App Timer (home/activities)
  "/screenshots/Screenshot_1784432246.png",     // Locator (time/friends)
  "/screenshots/Screenshot_fallback.png",       // AI Goals (WillPet)
  "/screenshots/Screenshot_1784432244.png",     // Deposits (settings/wallet)
];

interface FeatureSection {
  key: string;
  icon: IconType;
  position: "left" | "right";
}

const FEATURE_SECTIONS: FeatureSection[] = [
  { key: "escrow", icon: MdAccountBalance, position: "left" },
  { key: "alarm", icon: MdAlarm, position: "right" },
  { key: "appTimer", icon: MdTimer, position: "left" },
  { key: "locator", icon: MdLocationOn, position: "right" },
  { key: "unmeasurable", icon: MdSmartToy, position: "left" },
  { key: "deposits", icon: MdAccountBalanceWallet, position: "right" },
];

export function PhoneShowcase() {
  const t = useTranslations("features");
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const screenshotRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const phone = phoneRef.current;
    if (!section || !sticky || !phone) return;

    const ctx = gsap.context(() => {
      const totalSections = FEATURE_SECTIONS.length;

      // Pin the sticky container
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        pin: sticky,
        pinSpacing: false,
      });

      // For each feature section, create scroll-triggered animations
      FEATURE_SECTIONS.forEach((feat, idx) => {
        const progress = idx / totalSections;
        const nextProgress = (idx + 1) / totalSections;

        ScrollTrigger.create({
          trigger: section,
          start: `${progress * 100}% top`,
          end: `${nextProgress * 100}% top`,
          onEnter: () => activateSection(idx),
          onEnterBack: () => activateSection(idx),
        });
      });

      function activateSection(idx: number) {
        setActiveIndex(idx);

        // Animate screenshots — fade out all, fade in active
        screenshotRefs.current.forEach((img, i) => {
          if (!img) return;
          gsap.to(img, {
            opacity: i === idx ? 1 : 0,
            duration: 0.5,
            ease: "power2.inOut",
          });
        });

        // Animate feature cards — fade out all, fade in active
        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const innerCard = card.querySelector(".feature-card");
          if (!innerCard) return;

          if (i === idx) {
            gsap.to(innerCard, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power3.out",
            });
          } else {
            gsap.to(innerCard, {
              opacity: 0,
              y: 30,
              duration: 0.3,
              ease: "power2.in",
            });
          }
        });

        // Animate phone position (shift left/right)
        const isLeft = FEATURE_SECTIONS[idx].position === "left";
        const isDesktop = window.innerWidth > 900;
        const xPhone = isDesktop ? (isLeft ? -40 : 450) : 0;
        const xCards = isDesktop ? (isLeft ? 40 : -350) : 0;

        gsap.to(phone, {
          x: xPhone,
          duration: 0.7,
          ease: "power3.out",
        });

        if (cardsWrapperRef.current) {
          gsap.to(cardsWrapperRef.current, {
            x: xCards,
            duration: 0.7,
            ease: "power3.out",
          });
        }
      }

      // Activate first section initially
      activateSection(0);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="phone-showcase"
      id="features"
      style={{ height: `${(FEATURE_SECTIONS.length + 1) * 100}vh` }}
    >
      <div ref={stickyRef} className="phone-showcase__sticky">
        {/* Icon Rain Background */}
        <IconRain activeIndex={activeIndex} />

        {/* Content: Phone + Feature Cards */}
        <div className="phone-showcase__content">
          {/* Phone Wrapper */}
          <div ref={phoneRef} className="phone-wrapper">
            <div className="screenshots-stack">
              {SCREENSHOTS.map((src, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  ref={(el) => {
                    screenshotRefs.current[idx] = el;
                  }}
                  src={src}
                  alt={`App screenshot ${idx + 1}`}
                  className={`screenshot ${idx === 0 ? "screenshot--active" : ""}`}
                  loading="lazy"
                />
              ))}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/frames/Pixel_9_Pro_Xl.svg"
              alt=""
              className="phone-frame"
              aria-hidden="true"
            />
          </div>

          {/* Feature Cards Stack */}
          <div ref={cardsWrapperRef} className="phone-showcase__cards-wrapper" style={{ position: "relative", minHeight: 200, width: "100%", maxWidth: 400 }}>
            {FEATURE_SECTIONS.map((feat, idx) => (
              <div
                key={feat.key}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                }}
              >
                <FeatureCard
                  icon={feat.icon}
                  title={t(`${feat.key}.title`)}
                  description={t(`${feat.key}.description`)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
