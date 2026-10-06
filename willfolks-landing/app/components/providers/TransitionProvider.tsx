"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, createTimeline, stagger, steps, utils } from "animejs";
import { prefersReducedMotion } from "@/lib/motion";
import { LogoMark } from "../ui/LogoMark";
import { useLenis } from "./LenisProvider";

const CELL_COUNT = 96;
const BOOT_KEY = "wf-booted";
const NAV_FAILSAFE_MS = 4000;

interface Point {
  x: number;
  y: number;
}

interface TransitionContextValue {
  /** Wipe the screen, then go to `href` (a route, a `#section`, or both). */
  navigate: (href: string, origin?: Point) => void;
  /** Run `action` while the screen is covered (e.g. swapping the language). */
  behindCurtain: (
    label: string,
    action: () => void | Promise<void>,
    origin?: Point,
  ) => Promise<void>;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigate: () => {},
  behindCurtain: async (_label, action) => {
    await action();
  },
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

function gridShape(): [number, number] {
  const cols = window.innerWidth < 720 ? 6 : 12;
  return [cols, CELL_COUNT / cols];
}

interface TransitionProviderProps {
  children: React.ReactNode;
  bootLines: string[];
}

export function TransitionProvider({ children, bootLines }: TransitionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();

  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const busyRef = useRef(false);
  const pendingRef = useRef<{ path: string; hash: string | null } | null>(null);
  const failsafeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cells = useCallback(
    () => Array.from(overlayRef.current?.querySelectorAll<HTMLElement>(".wipe__cell") ?? []),
    [],
  );

  const jumpTo = useCallback(
    (hash: string | null) => {
      const el = hash ? document.getElementById(hash) : null;
      const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
      if (lenis.current) {
        // After a route change Lenis still holds the previous page's scroll
        // limit and would clamp the jump, so re-measure first.
        lenis.current.resize();
        lenis.current.scrollTo(top, { immediate: true, force: true });
      } else {
        window.scrollTo(0, top);
      }
    },
    [lenis],
  );

  const cover = useCallback(
    (label: string, origin?: Point) => {
      const overlay = overlayRef.current;
      if (!overlay) return Promise.resolve();
      const [cols, rows] = gridShape();
      overlay.style.setProperty("--wipe-cols", String(cols));
      overlay.dataset.state = "cover";
      if (labelRef.current) labelRef.current.textContent = label;

      const col = origin ? Math.floor((origin.x / window.innerWidth) * cols) : cols >> 1;
      const row = origin ? Math.floor((origin.y / window.innerHeight) * rows) : rows >> 1;
      const from = Math.min(CELL_COUNT - 1, Math.max(0, row * cols + col));

      utils.set(".wipe__label", { opacity: 0 });
      const tl = createTimeline({ defaults: { ease: "outQuart" } })
        .add(cells(), {
          scale: [0, 1.04],
          duration: 340,
          delay: stagger(16, { grid: [cols, rows], from }),
        })
        .add(".wipe__label", { opacity: [0, 1], duration: 120, ease: steps(2) }, "-=160");
      return tl.then(() => undefined);
    },
    [cells],
  );

  const uncover = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const [cols, rows] = gridShape();
    createTimeline({
      defaults: { ease: "inOutQuart" },
      onComplete: () => {
        overlay.dataset.state = "idle";
        busyRef.current = false;
      },
    })
      .add(".wipe__label, .wipe__boot", { opacity: 0, duration: 100, ease: steps(2) })
      .add(
        cells(),
        {
          scale: [1.04, 0],
          duration: 380,
          delay: stagger(14, { grid: [cols, rows], from: "last" }),
        },
        40,
      );
  }, [cells]);

  const navigate = useCallback(
    (href: string, origin?: Point) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }
      const samePath = url.pathname === window.location.pathname;
      const hash = url.hash ? decodeURIComponent(url.hash.slice(1)) : null;
      const target = url.pathname + url.search + url.hash;

      if (prefersReducedMotion()) {
        if (samePath) {
          jumpTo(hash);
          window.history.pushState(null, "", target);
        } else {
          router.push(target);
        }
        return;
      }

      if (busyRef.current) return;
      busyRef.current = true;

      const label = samePath && hash ? `#${hash}` : url.pathname + (hash ? `#${hash}` : "");
      cover(label.toUpperCase(), origin).then(() => {
        if (samePath) {
          jumpTo(hash);
          window.history.pushState(null, "", target);
          requestAnimationFrame(uncover);
          return;
        }
        pendingRef.current = { path: url.pathname, hash };
        router.push(target, { scroll: false });
        // Never leave the visitor behind the curtain if the route stalls.
        failsafeRef.current = setTimeout(() => {
          pendingRef.current = null;
          uncover();
        }, NAV_FAILSAFE_MS);
      });
    },
    [cover, jumpTo, router, uncover],
  );

  const behindCurtain = useCallback(
    async (label: string, action: () => void | Promise<void>, origin?: Point) => {
      if (prefersReducedMotion()) {
        await action();
        return;
      }
      if (busyRef.current) return;
      busyRef.current = true;
      await cover(label.toUpperCase(), origin);
      try {
        await action();
      } finally {
        requestAnimationFrame(uncover);
      }
    },
    [cover, uncover],
  );

  // Finish a route transition once the new page has rendered.
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || pending.path !== pathname) return;
    pendingRef.current = null;
    if (failsafeRef.current) clearTimeout(failsafeRef.current);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        jumpTo(pending.hash);
        uncover();
      }),
    );
  }, [pathname, jumpTo, uncover]);

  // First paint: the overlay is server-rendered closed, so play the boot
  // sequence once per session and a quick reveal afterwards.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const [cols] = gridShape();
    overlay.style.setProperty("--wipe-cols", String(cols));

    let booted = false;
    try {
      booted = sessionStorage.getItem(BOOT_KEY) === "1";
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      // Storage can be blocked; the boot sequence simply replays.
    }

    if (prefersReducedMotion()) {
      overlay.dataset.state = "idle";
      return;
    }

    busyRef.current = true;
    if (booted) {
      utils.set(".wipe__boot", { opacity: 0 });
      uncover();
      return;
    }

    const boot = createTimeline({ defaults: { ease: steps(3) }, onComplete: uncover })
      .add(".wipe__boot-mark", { opacity: [0, 1], scale: [0.6, 1], duration: 260, ease: "outBack" })
      .add(".wipe__boot-line", { opacity: [0, 1], duration: 90, delay: stagger(110) }, 120)
      .add(".wipe__boot-bar i", { scaleX: [0, 1], duration: 620, ease: "inOutQuart" }, 160)
      .add({ duration: 140 });

    return () => {
      boot.revert();
    };
  }, [uncover]);

  // Keep the spinning boot mark honest on its own axis while visible.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const spin = animate(".wipe__boot-ring", {
      rotate: 360,
      duration: 6000,
      ease: "linear",
      loop: true,
    });
    return () => {
      spin.revert();
    };
  }, []);

  const value = useMemo(() => ({ navigate, behindCurtain }), [navigate, behindCurtain]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div className="wipe" ref={overlayRef} data-state="boot" aria-hidden="true">
        <div className="wipe__grid">
          {Array.from({ length: CELL_COUNT }, (_, i) => (
            <i key={i} className="wipe__cell" />
          ))}
        </div>
        <div className="wipe__boot">
          <div className="wipe__boot-mark">
            <svg className="wipe__boot-ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" />
            </svg>
            <LogoMark />
          </div>
          <div className="wipe__boot-lines">
            {bootLines.map((line) => (
              <p key={line} className="wipe__boot-line">
                {line}
              </p>
            ))}
          </div>
          <div className="wipe__boot-bar">
            <i />
          </div>
        </div>
        <span className="wipe__label" ref={labelRef} />
      </div>
    </TransitionContext.Provider>
  );
}
