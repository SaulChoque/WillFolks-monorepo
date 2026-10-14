"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { API_URL } from "@/lib/site";

type State = "checking" | "up" | "down";

/** Pings the backend's /health every 30 s and shows whether it answers. */
export function ApiStatus() {
  const t = useTranslations("project.live.status");
  const [state, setState] = useState<State>("checking");

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
        const body = (await res.json()) as { status?: string };
        if (alive) setState(res.ok && body.status === "ok" ? "up" : "down");
      } catch {
        if (alive) setState("down");
      }
    };
    void check();
    const timer = window.setInterval(check, 30_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <p className={`status status--${state} mono`} role="status">
      <i aria-hidden="true" />
      {t(state)}
    </p>
  );
}
