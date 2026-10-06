"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { animate, createScope, onScroll, stagger } from "animejs";
import { SITE } from "@/lib/site";
import { prefersReducedMotion, revealOnScroll } from "@/lib/motion";
import { SectionHead } from "./ui/SectionHead";
import { SplitWords } from "./ui/SplitWords";

const QUESTION_COUNT = 5;

export function FaqSection() {
  const t = useTranslations("faq");
  const rootRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scope = createScope({ root }).add(() => {
      revealOnScroll(".sec-head > *", { y: 0, x: -18, each: 60 });
      revealOnScroll(".qa", { trigger: root.querySelector(".faq__list"), each: 80, y: 36 });
      revealOnScroll(".faq__contact", { trigger: root.querySelector(".faq__aside") });

      if (prefersReducedMotion()) return;

      animate(".faq__title .w__in", {
        y: ["105%", "0%"],
        duration: 1000,
        delay: stagger(60),
        ease: "outExpo",
        autoplay: onScroll({ target: ".faq__title", enter: "bottom-=8% top" }),
      });

      // The big glyph flips on its vertical axis, like a coin.
      animate(".faq__glyph", {
        rotateY: [0, 360],
        duration: 4200,
        ease: "inOutQuart",
        loop: true,
        loopDelay: 1600,
      });
      animate(".faq__glyph", {
        y: [30, -30],
        ease: "linear",
        autoplay: onScroll({ target: root, enter: "bottom top", leave: "top bottom", sync: 0.4 }),
      });
    });

    return () => scope.revert();
  }, []);

  return (
    <section className="faq sec sec--ink" id="faq" ref={rootRef}>
      <div className="wrap">
        <SectionHead index="06" tag={t("tag")} meta={t("meta")} />

        <div className="faq__grid">
          <div className="faq__aside">
            <h2 className="faq__title display">
              <SplitWords text={t("title")} />
            </h2>
            <span className="faq__glyph pixel" aria-hidden="true">
              ?
            </span>
            <p className="faq__contact">
              {t("contactLead")}{" "}
              <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
            </p>
          </div>

          <div className="faq__list">
            {Array.from({ length: QUESTION_COUNT }, (_, i) => {
              const n = i + 1;
              const isOpen = openIndex === i;
              return (
                <div key={n} className={`qa ${isOpen ? "is-open" : ""}`}>
                  <h3>
                    <button
                      type="button"
                      className="qa__q"
                      id={`faq-q${n}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-a${n}`}
                      onClick={() => setOpenIndex(isOpen ? null : i)}
                    >
                      <span className="qa__idx mono" aria-hidden="true">
                        Q.0{n}
                      </span>
                      <span className="qa__text">{t(`q${n}`)}</span>
                      <span className="qa__sign" aria-hidden="true" />
                    </button>
                  </h3>
                  <div
                    className="qa__panel"
                    id={`faq-a${n}`}
                    role="region"
                    aria-labelledby={`faq-q${n}`}
                    inert={!isOpen}
                  >
                    <div className="qa__inner">
                      <p>{t(`a${n}`)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
