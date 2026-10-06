"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { STORE_LINKS } from "@/lib/site";
import { useSnackbar } from "../providers/SnackbarProvider";
import { pixelBurst } from "./pixelBurst";

type Store = keyof typeof STORE_LINKS;

interface StoreBadgeProps {
  store: Store;
}

// Official store artwork, used unmodified as the stores' guidelines require.
const BADGES: Record<"en" | "es", Record<Store, string>> = {
  en: {
    appStore: "/badges/Download_on_the_App_Store_Badge_US-UK_RGB_blk_092917.svg",
    googlePlay: "/badges/GetItOnGooglePlay_Badge_Web_color_English.svg",
    github: "/badges/get-it-on-github.svg",
  },
  es: {
    appStore: "/badges/Download_on_the_App_Store_Badge_ES_RGB_blk_100217.svg",
    googlePlay: "/badges/GetItOnGooglePlay_Badge_Web_color_Spanish.svg",
    github: "/badges/get-it-on-github.svg",
  },
};

export function StoreBadge({ store }: StoreBadgeProps) {
  const t = useTranslations("download");
  const tSnackbar = useTranslations("snackbar");
  const locale = useLocale();
  const { showSnackbar } = useSnackbar();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const href = STORE_LINKS[store];
  const name = t(`stores.${store}`);
  const label = t("badgeLabel", { store: name });
  const src = BADGES[locale === "es" ? "es" : "en"][store];

  const handleClick = () => {
    if (buttonRef.current) pixelBurst(buttonRef.current);
    if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      showSnackbar(tSnackbar("comingSoon", { store: name }));
    }
  };

  return (
    <button
      type="button"
      className="store-badge"
      onClick={handleClick}
      id={`download-${store}`}
      aria-label={label}
      ref={buttonRef}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" height={52} />
    </button>
  );
}
