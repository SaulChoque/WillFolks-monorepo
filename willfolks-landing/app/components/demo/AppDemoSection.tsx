"use client";

import { useEffect, useReducer, useRef } from "react";
import { useTranslations } from "next-intl";
import { animate, createAnimatable, createScope, onScroll, stagger } from "animejs";
import { isCoarsePointer, prefersReducedMotion, revealOnScroll } from "@/lib/motion";
import type { PixelIconName } from "@/lib/pixel-icons";
import { PixelIcon } from "../ui/PixelIcon";
import { SectionHead } from "../ui/SectionHead";
import { SplitWords } from "../ui/SplitWords";
import { DemoApp } from "./DemoApp";
import { INITIAL_STATE, TABS, demoReducer, type DemoAction, type TabId } from "./state";

const TOUR: TabId[] = ["home", "goals", "pet", "time", "settings"];
const TOUR_INTERVAL_MS = 3800;

const SCENARIOS: { key: string; icon: PixelIconName; action: DemoAction }[] = [
  { key: "alarm", icon: "alarm", action: { type: "alarmStart" } },
  { key: "stake", icon: "plus", action: { type: "openSheet" } },
  { key: "pet", icon: "heart", action: { type: "tab", tab: "pet" } },
];

export function AppDemoSection() {
  const t = useTranslations("demo");
  const [state, dispatch] = useReducer(demoReducer, INITIAL_STATE);
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const touchedRef = useRef(false);
  const tabRef = useRef(state.tab);

  useEffect(() => {
    tabRef.current = state.tab;
  }, [state.tab]);

  // Entrances, parallax and the pointer-driven tilt of the handset.
  useEffect(() => {
    const section = sectionRef.current;
    const phone = phoneRef.current;
    if (!section || !phone) return;

    const scope = createScope({ root: section }).add(() => {
      revealOnScroll(".sec-head > *", { y: 0, x: -18, each: 60 });
      revealOnScroll(".demo__lede, .demo__try > *", {
        trigger: section.querySelector(".demo__copy"),
        each: 70,
      });
      revealOnScroll(".demo__side > *", { trigger: section.querySelector(".demo__side"), each: 70 });

      if (prefersReducedMotion()) return;

      animate(".demo__title .w__in", {
        y: ["105%", "0%"],
        duration: 1000,
        delay: stagger(60),
        ease: "outExpo",
        autoplay: onScroll({ target: ".demo__title", enter: "bottom-=8% top" }),
      });

      animate(".demo__device", {
        y: [120, 0],
        rotate: [-6, 0],
        opacity: [0, 1],
        duration: 1300,
        ease: "outExpo",
        autoplay: onScroll({ target: ".demo__stage", enter: "bottom-=18% top" }),
      });

      // Depth: the glow and the ghost word travel slower than the phone.
      const drift = (targets: string, from: number, to: number) =>
        animate(targets, {
          y: [from, to],
          ease: "linear",
          autoplay: onScroll({ target: section, enter: "bottom top", leave: "top bottom", sync: 0.4 }),
        });
      drift(".demo__ghost", 140, -140);
      drift(".demo__glow", -70, 70);
      drift(".demo__orbit", 60, -60);

      animate(".demo__orbit-ring", { rotate: 360, duration: 48000, ease: "linear", loop: true });
      animate(".phone__led", { opacity: [1, 0.25], duration: 900, loop: true, alternate: true });
    });

    if (isCoarsePointer() || prefersReducedMotion()) return () => scope.revert();

    const tilt = createAnimatable(phone, { rotateX: 700, rotateY: 700, ease: "out(3)" });
    const onMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      tilt.rotateY(nx * 16);
      tilt.rotateX(-ny * 10);
    };
    const onLeave = () => {
      tilt.rotateX(0);
      tilt.rotateY(0);
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      tilt.revert();
      scope.revert();
    };
  }, []);

  // Auto-tour: flip through the tabs until the visitor takes over.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion()) return;

    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.45 },
    );
    observer.observe(section);

    const takeOver = () => {
      touchedRef.current = true;
    };
    section.addEventListener("pointerdown", takeOver);
    section.addEventListener("keydown", takeOver);

    const timer = setInterval(() => {
      if (!visible || touchedRef.current || document.hidden) return;
      const next = TOUR[(TOUR.indexOf(tabRef.current) + 1) % TOUR.length];
      dispatch({ type: "tab", tab: next });
    }, TOUR_INTERVAL_MS);

    return () => {
      observer.disconnect();
      clearInterval(timer);
      section.removeEventListener("pointerdown", takeOver);
      section.removeEventListener("keydown", takeOver);
    };
  }, []);

  const ringing = state.alarm?.phase === "ringing";

  return (
    <section className="demo sec sec--ink" id="demo" ref={sectionRef}>
      <span className="demo__ghost display" aria-hidden="true">
        {t("ghost")}
      </span>

      <div className="wrap">
        <SectionHead index="04" tag={t("tag")} meta={t("meta")} />

        <div className="demo__grid">
          <div className="demo__copy">
            <h2 className="demo__title display">
              <SplitWords text={t("title")} highlight={t.raw("titleHighlight") as string[]} />
            </h2>
            <p className="demo__lede">{t("body")}</p>

            <div className="demo__try">
              <p className="mono demo__try-label">{t("tryLabel")}</p>
              {SCENARIOS.map(({ key, icon, action }, i) => (
                <button key={key} type="button" className="scenario" onClick={() => dispatch(action)}>
                  <span className="scenario__idx mono">.0{i + 1}</span>
                  <PixelIcon name={icon} size={20} />
                  <span className="scenario__text">
                    <strong>{t(`scenarios.${key}.title`)}</strong>
                    <span>{t(`scenarios.${key}.body`)}</span>
                  </span>
                  <span className="scenario__go" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="demo__stage">
            <div className="demo__glow" aria-hidden="true" />
            <div className="demo__orbit" aria-hidden="true">
              <svg className="demo__orbit-ring" viewBox="0 0 400 400">
                <circle cx="200" cy="200" r="196" strokeDasharray="2 10" />
                <circle cx="200" cy="200" r="160" />
                <path d="M200 0v20M200 380v20M0 200h20M380 200h20" />
              </svg>
            </div>

            <div className="demo__device">
              <div
                className={`phone grain ${ringing && state.settings.vibration ? "phone--ringing" : ""}`}
                ref={phoneRef}
              >
                <span className="phone__btn phone__btn--a" aria-hidden="true" />
                <span className="phone__btn phone__btn--b" aria-hidden="true" />
                <span className="phone__screw phone__screw--tl" aria-hidden="true" />
                <span className="phone__screw phone__screw--tr" aria-hidden="true" />
                <span className="phone__screw phone__screw--bl" aria-hidden="true" />
                <span className="phone__screw phone__screw--br" aria-hidden="true" />
                <div className="phone__screen">
                  <DemoApp state={state} dispatch={dispatch} />
                </div>
                <div className="phone__chin" aria-hidden="true">
                  <span className="phone__grille" />
                  <span className="phone__model">WILLFOLKS · WF-01</span>
                  <span className="phone__led" />
                </div>
              </div>
            </div>
          </div>

          <aside className="demo__side">
            <p className="mono demo__try-label">{t("screensLabel")}</p>
            <div className="demo__tabs" role="tablist" aria-label={t("screensLabel")}>
              {TABS.map(({ id, icon }, i) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={state.tab === id}
                  className="demo__tab"
                  onClick={() => dispatch({ type: "tab", tab: id })}
                >
                  <span className="mono">0{i + 1}</span>
                  <PixelIcon name={icon} size={18} />
                  <span>{t(`app.tabs.${id}`)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="demo__theme mono"
              onClick={() => dispatch({ type: "theme", theme: state.theme === "acid" ? "void" : "acid" })}
            >
              <i data-on={state.theme === "acid"} />
              {t("flip")}: {t(`app.settings.theme.${state.theme}`)}
            </button>
            <p className="demo__note mono">{t("note")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
