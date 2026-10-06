"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Dispatch } from "react";
import { useTranslations } from "next-intl";
import { animate, createTimeline, stagger, steps, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import { PixelIcon } from "../ui/PixelIcon";
import {
  AlarmOverlay,
  GoalsScreen,
  HomeScreen,
  NewGoalSheet,
  PetScreen,
  SettingsScreen,
  TimeScreen,
} from "./screens";
import { TABS, type DemoAction, type DemoState } from "./state";

// A one-second clock as an external store: hydration-safe (the server
// snapshot is "no time yet") and shared by every subscriber.
const subscribeToSeconds = (notify: () => void) => {
  const timer = setInterval(notify, 1000);
  return () => clearInterval(timer);
};
const readSeconds = () => Math.floor(Date.now() / 1000);
const readServerSeconds = () => 0;

function useNow(): Date | null {
  const seconds = useSyncExternalStore(subscribeToSeconds, readSeconds, readServerSeconds);
  return seconds ? new Date(seconds * 1000) : null;
}

const BURST_PIECES = 22;

interface DemoAppProps {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
}

export function DemoApp({ state, dispatch }: DemoAppProps) {
  const t = useTranslations("demo.app");
  const now = useNow();
  const viewRef = useRef<HTMLDivElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLParagraphElement>(null);

  // Screen change: an LCD refresh bar sweeps down while the blocks step in.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || prefersReducedMotion()) return;
    const blocks = view.querySelectorAll(".app-screen > *");
    const refresh = view.parentElement?.querySelector(".app__refresh");
    const tl = createTimeline()
      .add(blocks, {
        opacity: [0, 1],
        y: [10, 0],
        duration: 260,
        delay: stagger(45),
        ease: steps(4),
      });
    if (refresh) tl.add(refresh, { y: ["-100%", "900%"], duration: 420, ease: "linear" }, 0);
    return () => {
      tl.revert();
    };
  }, [state.tab]);

  // Celebration: a spray of pixels from the centre of the screen.
  useEffect(() => {
    const host = burstRef.current;
    if (!host || state.celebrate === 0 || prefersReducedMotion()) return;

    const pieces = Array.from({ length: BURST_PIECES }, () => {
      const piece = document.createElement("i");
      host.appendChild(piece);
      return piece;
    });
    const spray = animate(pieces, {
      x: () => utils.random(-130, 130),
      y: () => utils.random(-190, 70),
      rotate: () => utils.random(-180, 180),
      scale: [{ to: [0, 1], duration: 120 }, { to: 0, duration: 780 }],
      duration: 900,
      delay: stagger(8),
      ease: "outExpo",
      onComplete: () => pieces.forEach((piece) => piece.remove()),
    });
    return () => {
      spray.cancel();
      pieces.forEach((piece) => piece.remove());
    };
  }, [state.celebrate]);

  // Confirmation toast, only when a stake has just been locked.
  useEffect(() => {
    const toast = toastRef.current;
    if (!toast || state.locked === 0) return;
    const show = animate(toast, {
      opacity: [{ to: 1, duration: 120 }, { to: 1, duration: 1400 }, { to: 0, duration: 200 }],
      y: [{ to: [12, 0], duration: 220 }],
      ease: "outExpo",
    });
    return () => {
      show.revert();
    };
  }, [state.locked]);

  const screenProps = { state, dispatch };

  return (
    <div className="app" data-theme={state.theme}>
      <div className="app__status">
        <span>{now ? now.toTimeString().slice(0, 5) : "--:--"}</span>
        <span className="app__status-icons" aria-hidden="true">
          <i className="app__signal" />
          <i className="app__battery" />
        </span>
      </div>

      <header className="app__top">
        <span className="app__avatar">S</span>
        <span className="app__title">{t(`tabs.${state.tab}`)}</span>
        <span className="app__top-icon">
          <PixelIcon name="chat" size={16} />
        </span>
      </header>

      <div className="app__view" ref={viewRef} key={state.tab}>
        {state.tab === "home" ? <HomeScreen {...screenProps} /> : null}
        {state.tab === "time" ? <TimeScreen {...screenProps} now={now} /> : null}
        {state.tab === "pet" ? <PetScreen {...screenProps} /> : null}
        {state.tab === "goals" ? <GoalsScreen {...screenProps} /> : null}
        {state.tab === "settings" ? <SettingsScreen {...screenProps} /> : null}
      </div>

      <nav className="app__tabs" aria-label={t("tabsLabel")}>
        {TABS.map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            className={`app__tab ${id === "pet" ? "app__tab--pet" : ""}`}
            aria-current={state.tab === id ? "page" : undefined}
            aria-label={t(`tabs.${id}`)}
            onClick={() => dispatch({ type: "tab", tab: id })}
          >
            <PixelIcon name={icon} size={id === "pet" ? 22 : 18} />
          </button>
        ))}
      </nav>

      <NewGoalSheet {...screenProps} />
      <AlarmOverlay {...screenProps} />

      <p className="app__toast" ref={toastRef} aria-hidden="true">
        {t("toast")}
      </p>
      <div className="app__burst" ref={burstRef} aria-hidden="true" />
      <i className="app__refresh" aria-hidden="true" />
      <i className="app__lcd" aria-hidden="true" />
    </div>
  );
}
