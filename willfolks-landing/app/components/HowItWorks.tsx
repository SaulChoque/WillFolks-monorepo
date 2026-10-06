"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, createScope, onScroll, stagger } from "animejs";
import { prefersReducedMotion, revealOnScroll } from "@/lib/motion";
import { SectionHead } from "./ui/SectionHead";
import { SplitWords } from "./ui/SplitWords";

const STEPS = ["stake", "prove", "keep"] as const;

function StepGlyph({ step }: { step: (typeof STEPS)[number] }) {
  if (step === "stake") {
    return (
      <svg className="glyph glyph-coin" viewBox="0 0 120 120" aria-hidden="true">
        <path d="M18 96h84" />
        <path d="M32 104h56" strokeDasharray="2 6" />
        <path className="glyph-coin__trail" d="M60 76v14" strokeDasharray="3 4" />
        <g className="glyph-coin__disc">
          <circle cx="60" cy="46" r="27" className="glyph__solid" />
          <circle cx="60" cy="46" r="19" className="glyph__cut" />
          <path d="M60 36v20" className="glyph__cut" strokeWidth="5" />
        </g>
      </svg>
    );
  }
  if (step === "prove") {
    return (
      <svg className="glyph glyph-radar" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="46" />
        <circle cx="60" cy="60" r="30" strokeDasharray="2 6" />
        <circle cx="60" cy="60" r="14" />
        <path d="M60 6v14M60 100v14M6 60h14M100 60h14" />
        <g className="glyph-radar__sweep">
          <path d="M60 60V14A46 46 0 0 1 92.5 27.5Z" className="glyph__solid glyph__soft" />
          <path d="M60 60V14" strokeWidth="2.5" />
        </g>
        <rect className="glyph-radar__blip glyph__solid" x="78" y="36" width="7" height="7" />
        <rect className="glyph-radar__blip glyph__solid" x="34" y="72" width="7" height="7" />
        <rect className="glyph-radar__blip glyph__solid" x="70" y="80" width="7" height="7" />
      </svg>
    );
  }
  return (
    <svg className="glyph glyph-lock" viewBox="0 0 120 120" aria-hidden="true">
      <g className="glyph-lock__ring">
        <circle cx="60" cy="60" r="52" strokeDasharray="1 8" />
        <path d="M60 2v8M60 110v8M2 60h8M110 60h8" />
      </g>
      <path className="glyph-lock__shackle" d="M43 58V45a17 17 0 0 1 34 0v13" strokeWidth="6" />
      <rect x="34" y="58" width="52" height="38" className="glyph__solid" />
      <path d="M60 70v14" className="glyph__cut" strokeWidth="6" />
    </svg>
  );
}

export function HowItWorks() {
  const t = useTranslations("how");
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      revealOnScroll(".sec-head > *", { y: 0, x: -18, each: 60 });
      revealOnScroll(".step", { trigger: root.querySelector(".how__steps"), y: 70, each: 130 });
      revealOnScroll(".outcome", { trigger: root.querySelector(".how__outcomes"), y: 40, each: 120 });

      if (prefersReducedMotion()) return;

      animate(".how__title .w__in", {
        y: ["105%", "0%"],
        duration: 1000,
        delay: stagger(55),
        ease: "outExpo",
        autoplay: onScroll({ target: ".how__title", enter: "bottom-=8% top" }),
      });

      // Connector fills as the row scrolls through the viewport.
      animate(".how__wire i", {
        scaleX: [0, 1],
        ease: "linear",
        autoplay: onScroll({
          target: ".how__steps",
          enter: "bottom-=15% top",
          leave: "center center",
          sync: 0.3,
        }),
      });

      // Static, on-axis loops: each glyph turns or flips in place.
      animate(".glyph-coin__disc", {
        scaleX: [1, -1],
        duration: 1300,
        ease: "inOutSine",
        loop: true,
        alternate: true,
      });
      animate(".glyph-coin__trail", {
        strokeDashoffset: [0, -14],
        duration: 700,
        ease: "linear",
        loop: true,
      });
      animate(".glyph-radar__sweep", { rotate: 360, duration: 3400, ease: "linear", loop: true });
      animate(".glyph-radar__blip", {
        opacity: [0, 1, 0],
        duration: 3400,
        delay: stagger(1100),
        ease: "outQuad",
        loop: true,
      });
      animate(".glyph-lock__ring", { rotate: -360, duration: 18000, ease: "linear", loop: true });
      animate(".glyph-lock__shackle", {
        y: [0, -9],
        duration: 520,
        ease: "outBack(3)",
        loop: true,
        alternate: true,
        loopDelay: 1100,
      });

      // Slow drift on the backdrop numerals.
      animate(".how__ghost", {
        y: [80, -80],
        ease: "linear",
        autoplay: onScroll({ target: root, enter: "bottom top", leave: "top bottom", sync: 0.4 }),
      });
    });

    return () => scope.revert();
  }, []);

  return (
    <section className="how sec sec--ink" id="how" ref={rootRef}>
      <span className="how__ghost pixel" aria-hidden="true">
        01—02—03
      </span>
      <div className="wrap">
        <SectionHead index="02" tag={t("tag")} meta={t("meta")} />

        <h2 className="how__title display">
          <SplitWords text={t("title")} highlight={t.raw("titleHighlight") as string[]} />
        </h2>

        <div className="how__wire" aria-hidden="true">
          <i />
        </div>

        <ol className="how__steps">
          {STEPS.map((step, i) => (
            <li className="step hud" key={step}>
              <div className="step__top">
                <span className="step__num pixel">0{i + 1}</span>
                <StepGlyph step={step} />
              </div>
              <h3 className="step__title">{t(`steps.${step}.title`)}</h3>
              <p className="step__body">{t(`steps.${step}.body`)}</p>
              <code className="step__code mono">{t(`steps.${step}.code`)}</code>
            </li>
          ))}
        </ol>

        <div className="how__outcomes">
          <article className="outcome outcome--win">
            <span className="outcome__mark pixel" aria-hidden="true">
              ▲
            </span>
            <div>
              <h3 className="outcome__title">{t("win.title")}</h3>
              <p>{t("win.body")}</p>
            </div>
          </article>
          <article className="outcome outcome--miss">
            <span className="outcome__mark pixel" aria-hidden="true">
              ▼
            </span>
            <div>
              <h3 className="outcome__title">{t("miss.title")}</h3>
              <p>{t("miss.body")}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
