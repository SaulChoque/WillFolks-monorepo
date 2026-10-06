"use client";

import { useRef } from "react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { usePageTransition } from "../providers/TransitionProvider";

type TransitionLinkProps = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string;
};

/**
 * `next/link` that plays the pixel wipe before navigating. Works for routes
 * (`/terms`), in-page sections (`#faq`) and both (`/#faq`). Modified clicks
 * (new tab, etc.) keep the browser default because Link skips `onNavigate`.
 */
export function TransitionLink({ href, onClick, children, ...rest }: TransitionLinkProps) {
  const { navigate } = usePageTransition();
  const origin = useRef<{ x: number; y: number } | undefined>(undefined);

  return (
    <Link
      href={href}
      {...rest}
      onClick={(event) => {
        // Keyboard activation reports 0,0 — fall back to a centred wipe.
        origin.current =
          event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : undefined;
        onClick?.(event);
      }}
      onNavigate={(event) => {
        event.preventDefault();
        navigate(href, origin.current);
      }}
    >
      {children}
    </Link>
  );
}
