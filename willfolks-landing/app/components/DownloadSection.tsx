"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, createScope, onScroll, stagger } from "animejs";
import { prefersReducedMotion, revealOnScroll } from "@/lib/motion";
import { LogoMark } from "./ui/LogoMark";
import { SectionHead } from "./ui/SectionHead";
import { SplitWords } from "./ui/SplitWords";
import { StoreBadge } from "./ui/StoreBadge";

/** Circumference of the seal's text path (r = 118). */
const SEAL_LENGTH = 741;

export function DownloadSection() {
  const t = useTranslations("download");
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      revealOnScroll(".sec-head > *", { y: 0, x: -18, each: 60 });
      revealOnScroll(".download__lede, .store-badge, .download__status", {
        trigger: root.querySelector(".download__copy"),
        each: 90,
        enter: "bottom-=25% top",
      });

      if (prefersReducedMotion()) return;

      animate(".download__title .w__in", {
        y: ["105%", "0%"],
        duration: 1000,
        delay: stagger(70),
        ease: "outExpo",
        autoplay: onScroll({ target: ".download__title", enter: "bottom-=8% top" }),
      });

      // On-axis loops: the seal turns one way, its tick ring the other.
      animate(".seal__spin", { rotate: 360, duration: 26000, ease: "linear", loop: true });
      animate(".seal__ticks", { rotate: -360, duration: 60000, ease: "linear", loop: true });
      animate(".seal__mark", {
        rotateY: [0, 360],
        duration: 5200,
        ease: "inOutQuart",
        loop: true,
        loopDelay: 1400,
      });

      const drift = (targets: string, from: number, to: number) =>
        animate(targets, {
          y: [from, to],
          ease: "linear",
          autoplay: onScroll({ target: root, enter: "bottom top", leave: "top bottom", sync: 0.4 }),
        });
      drift(".download__halftone", 110, -110);
      drift(".download__bars", -80, 80);
      drift(".download__seal", 70, -70);
    });

    return () => scope.revert();
  }, []);

  return (
    <section className="download sec sec--acid" id="download" ref={rootRef}>
      <div className="download__bg" aria-hidden="true">
        <div className="download__halftone" />
        <div className="download__bars stripes" />
        <span className="cross download__cross download__cross--a" />
        <span className="cross download__cross download__cross--b" />
      </div>

      <div className="wrap">
        <SectionHead index="05" tag={t("tag")} meta={t("meta")} />

        <div className="download__grid">
          <div className="download__copy">
            <h2 className="download__title display">
              <SplitWords text={t("title")} highlight={t.raw("titleHighlight") as string[]} />
            </h2>
            <p className="download__lede">{t("body")}</p>
            <div className="download__badges">
              <StoreBadge store="googlePlay" />
              <StoreBadge store="appStore" />
              <StoreBadge store="github" />
            </div>
            <p className="download__status mono">
              (…) {t("status")}{" "}
              <span className="blink" aria-hidden="true">
                ▮
              </span>
            </p>
          </div>

          <div className="download__seal" aria-hidden="true">
            <svg className="seal" viewBox="0 0 300 300">
              <defs>
                <path id="seal-path" d="M150 150m-118 0a118 118 0 1 1 236 0a118 118 0 1 1-236 0" />
              </defs>
              <g className="seal__ticks">
                <circle cx="150" cy="150" r="146" strokeDasharray="1 9" />
              </g>
              <g className="seal__spin">
                <text>
                  <textPath href="#seal-path" textLength={SEAL_LENGTH} lengthAdjust="spacing">
                    {t("seal")}
                  </textPath>
                </text>
              </g>
              <circle className="seal__disc" cx="150" cy="150" r="92" />
            </svg>
            <LogoMark className="seal__mark" />
          </div>
        </div>
      </div>
    </section>
  );
}
