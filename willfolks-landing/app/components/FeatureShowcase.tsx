"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { animate, createScope, onScroll, steps } from "animejs";
import { clamp, prefersReducedMotion } from "@/lib/motion";
import type { PixelIconName } from "@/lib/pixel-icons";
import { PixelIcon } from "./ui/PixelIcon";
import { SectionHead } from "./ui/SectionHead";
import { useLenis } from "./providers/LenisProvider";

const MorphParticles = dynamic(() => import("./three/MorphParticles"), { ssr: false });

// Order matches SHAPE_ORDER in lib/three/shapes.ts
const FEATURES: { key: string; icon: PixelIconName }[] = [
  { key: "escrow", icon: "lock" },
  { key: "alarm", icon: "alarm" },
  { key: "appTimer", icon: "hourglass" },
  { key: "locator", icon: "pin" },
  { key: "unmeasurable", icon: "spark" },
  { key: "deposits", icon: "coin" },
];

/** Viewport-heights of scroll given to each feature while the stage is pinned. */
const VH_PER_FEATURE = 70;

export function FeatureShowcase() {
  const t = useTranslations("features");
  const lenis = useLenis();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  // Scroll position inside the pinned section picks the active feature.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const scope = createScope({ root: section }).add(() => {
      onScroll({
        target: section,
        enter: "start start",
        leave: "end end",
        onUpdate: (self) => {
          const next = clamp(Math.floor(self.progress * FEATURES.length), 0, FEATURES.length - 1);
          setActive(next);
          section.style.setProperty("--progress", self.progress.toFixed(4));
        },
      });

      if (prefersReducedMotion()) return;
      animate(".features__ring", { rotate: 360, duration: 60000, ease: "linear", loop: true });
      animate(".features__ring--inner", { rotate: -360, duration: 34000, ease: "linear", loop: true });
    });

    return () => scope.revert();
  }, []);

  // Flicker the readout when the formation changes.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;
    const flicker = animate(section.querySelectorAll(".features__count, .features__readout"), {
      opacity: [0, 1],
      duration: 260,
      ease: steps(3),
    });
    return () => {
      flicker.cancel();
    };
  }, [active]);

  const scrollToFeature = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const travel = section.offsetHeight - window.innerHeight;
    // Aim for the middle of the feature's slice so it is clearly selected.
    const top = section.offsetTop + ((index + 0.5) / FEATURES.length) * travel;
    if (lenis.current) lenis.current.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section
      className="features sec--acid"
      id="features"
      ref={sectionRef}
      style={{ height: `${FEATURES.length * VH_PER_FEATURE + 100}svh` }}
    >
      <div className="features__sticky">
        <div className="features__head wrap">
          <SectionHead index="03" tag={t("tag")} meta={t("meta")} />
        </div>

        <div className="features__stage wrap">
          <div className="features__copy">
            <h2 className="features__title display">{t("sectionTitle")}</h2>
            <ol className="features__list">
              {FEATURES.map((feature, i) => {
                const isActive = i === active;
                return (
                  <li key={feature.key} className={`feat ${isActive ? "is-active" : ""}`}>
                    <button
                      type="button"
                      className="feat__row"
                      aria-expanded={isActive}
                      aria-controls={`feat-${feature.key}`}
                      onClick={() => scrollToFeature(i)}
                    >
                      <span className="feat__idx mono" aria-hidden="true">
                        .0{i + 1} &gt;
                      </span>
                      <span className="feat__title">{t(`${feature.key}.title`)}</span>
                      <PixelIcon name={feature.icon} size={22} className="feat__icon" />
                    </button>
                    <div className="feat__body" id={`feat-${feature.key}`} aria-hidden={!isActive}>
                      <p>{t(`${feature.key}.description`)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="features__viz" aria-hidden="true">
            <svg className="features__rings" viewBox="0 0 400 400">
              <g className="features__ring">
                <circle cx="200" cy="200" r="196" strokeDasharray="1 9" />
                <path d="M200 0v14M200 386v14M0 200h14M386 200h14" />
              </g>
              <g className="features__ring features__ring--inner">
                <circle cx="200" cy="200" r="150" />
                <path d="M200 44v12M200 344v12M44 200h12M344 200h12" />
              </g>
            </svg>
            <MorphParticles index={active} className="features__canvas" />
            <span className="features__count pixel">
              0{active + 1}
              <small>/0{FEATURES.length}</small>
            </span>
            <p className="features__readout mono">
              {t("readout.shape")}: {t(`${FEATURES[active].key}.shape`)}
              <br />
              {t("readout.mode")}: {t("readout.modeValue")}
            </p>
            <span className="cross features__cross features__cross--a" />
            <span className="cross features__cross features__cross--b" />
          </div>
        </div>

        <div className="features__progress wrap" aria-hidden="true">
          {FEATURES.map((feature, i) => (
            <i key={feature.key} className={i <= active ? "is-done" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}
