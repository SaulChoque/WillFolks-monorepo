"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  animate,
  createAnimatable,
  createScope,
  createTimeline,
  onScroll,
  stagger,
  steps,
} from "animejs";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/motion";
import { Marquee } from "./ui/Marquee";
import { TransitionLink } from "./ui/TransitionLink";

const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

const STEPS = ["stake", "prove", "keep"] as const;
const SPECS = ["stake", "verify", "escrow"] as const;

export function HeroSection() {
  const t = useTranslations("hero");
  const rootRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Poster fit: scale the headline so its widest line spans the column.
  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;
    const desktop = window.matchMedia("(min-width: 961px)");

    const fit = () => {
      if (!desktop.matches) {
        title.style.fontSize = "";
        return;
      }
      title.style.fontSize = "100px";
      const widest = Math.max(
        ...Array.from(title.querySelectorAll<HTMLElement>(".hero__line-in > span")).map(
          (line) => line.getBoundingClientRect().width,
        ),
      );
      const available = title.clientWidth;
      if (widest > 0) title.style.fontSize = `${Math.floor((available / widest) * 100)}px`;
    };

    const observer = new ResizeObserver(fit);
    observer.observe(title);
    document.fonts.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const scope = createScope({ root }).add(() => {
      // Headline: each line rises out of its own mask.
      createTimeline({ defaults: { ease: "outExpo" }, delay: 250 })
        .add(".hero__line-in", { y: ["108%", "0%"], duration: 1100, delay: stagger(110) })
        .add(".hero__hl", { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"], duration: 700 }, 520)
        .add(".hero__meta > *", { opacity: [0, 1], duration: 300, delay: stagger(90), ease: steps(3) }, 300)
        .add(".hero__foot > *", { opacity: [0, 1], y: [24, 0], duration: 900, delay: stagger(90) }, 700)
        .add(".hero__deco", { opacity: [0, 1], duration: 500, delay: stagger(60), ease: steps(4) }, 500);

      // Static, on-axis motion: the reticle and its counter-rotating ticks.
      animate(".hero__reticle-outer", { rotate: 360, duration: 38000, ease: "linear", loop: true });
      animate(".hero__reticle-inner", { rotate: -360, duration: 22000, ease: "linear", loop: true });
      animate(".hero__scan", { y: ["-10%", "110%"], duration: 5200, ease: "linear", loop: true });

      // Scroll parallax: layers leave at different speeds.
      const scrub = (targets: string, y: number, extra: Record<string, unknown> = {}) =>
        animate(targets, {
          y,
          ...extra,
          ease: "linear",
          autoplay: onScroll({ target: root, enter: "start start", leave: "start end", sync: 0.4 }),
        });
      scrub(".hero__title", -140);
      scrub(".hero__meta", -60);
      scrub(".hero__foot", -220, { opacity: [1, 0] });
      scrub(".hero__grid", 120);
      scrub(".hero__halftone", -90);
      scrub(".hero__reticle", -260);
      scrub(".hero__bars", -180);
    });

    // Pointer parallax on the flat layers (the 3D rig handles its own).
    if (isCoarsePointer()) return () => scope.revert();

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => ({
      depth: Number(el.dataset.depth),
      move: createAnimatable(el, { x: 900, y: 900, ease: "out(3)" }),
    }));
    const onMove = (event: PointerEvent) => {
      const nx = event.clientX / window.innerWidth - 0.5;
      const ny = event.clientY / window.innerHeight - 0.5;
      for (const layer of layers) {
        layer.move.x(nx * layer.depth);
        layer.move.y(ny * layer.depth);
      }
    };
    root.addEventListener("pointermove", onMove);

    return () => {
      root.removeEventListener("pointermove", onMove);
      layers.forEach((layer) => layer.move.revert());
      scope.revert();
    };
  }, []);

  return (
    <section className="hero sec--acid" id="hero" ref={rootRef}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__grid" />
        <div className="hero__parallax hero__parallax--blend" data-depth="-18">
          <div className="hero__halftone hero__deco" />
        </div>
        <div className="hero__parallax" data-depth="34">
          <div className="hero__bars stripes hero__deco" />
        </div>
        <div className="hero__parallax" data-depth="-46">
          <svg className="hero__reticle hero__deco" viewBox="0 0 200 200">
            <g className="hero__reticle-outer">
              <circle cx="100" cy="100" r="96" />
              <path d="M100 0v18M100 182v18M0 100h18M182 100h18" />
            </g>
            <g className="hero__reticle-inner">
              <circle cx="100" cy="100" r="62" strokeDasharray="3 9" />
              <path d="M100 30v14M100 156v14M30 100h14M156 100h14" />
            </g>
            <path d="M92 100h16M100 92v16" />
          </svg>
        </div>
        <div className="hero__scan" />
        <span className="cross hero__cross hero__cross--a hero__deco" />
        <span className="cross hero__cross hero__cross--b hero__deco" />
        <span className="cross hero__cross hero__cross--c hero__deco" />
      </div>

      <HeroScene className="hero__canvas" />

      <div className="hero__inner wrap">
        <div className="hero__meta mono">
          <ul className="hero__index">
            <li>— 01</li>
            <li>.{t("system")}</li>
            {STEPS.map((step, i) => (
              <li key={step}>
                .0{i + 1} &gt; {t(`steps.${step}`)}
              </li>
            ))}
          </ul>
          <p className="hero__status">
            (…) {t("status")}
            <span className="hero__dots" aria-hidden="true">
              {" "}
              ......
            </span>
            <span className="blink" aria-hidden="true">
              ▮
            </span>
          </p>
          <p className="hero__stamp">
            © {t("stamp")}
            <br />
            &gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;
          </p>
        </div>

        <h1 className="hero__title display" ref={titleRef}>
          {(["line1", "line2", "line3"] as const).map((line) => (
            <span className="hero__line" key={line}>
              <span className="hero__line-in">
                <span>
                  {t.rich(`title.${line}`, {
                    hl: (chunks) => <span className="hero__hl">{chunks}</span>,
                  })}
                </span>
              </span>
            </span>
          ))}
        </h1>

        <div className="hero__foot">
          <p className="hero__sub">{t("subtitle")}</p>
          <div className="hero__cta">
            <TransitionLink href="/#demo" className="btn">
              <span aria-hidden="true">▶</span>
              {t("ctaDemo")}
            </TransitionLink>
            <TransitionLink href="/#download" className="btn btn--line">
              {t("ctaDownload")}
              <span className="btn__arrow" aria-hidden="true">
                ↓
              </span>
            </TransitionLink>
          </div>
          <dl className="hero__specs mono">
            {SPECS.map((spec) => (
              <div key={spec}>
                <dt>{t(`specs.${spec}.label`)}</dt>
                <dd>{t(`specs.${spec}.value`)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Marquee items={t.raw("ticker") as string[]} className="hero__marquee" />
    </section>
  );
}
