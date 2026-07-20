"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSnackbar } from "./SnackbarProvider";
import Image from "next/image";

interface StoreBadgeProps {
  store: "googlePlay" | "appStore" | "github";
}

const BADGES = {
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

const STORE_CONFIG = {
  googlePlay: {
    nameKey: "googlePlay" as const,
    href: null,
  },
  appStore: {
    nameKey: "appStore" as const,
    href: null,
  },
  github: {
    nameKey: "github" as const,
    href: "https://github.com/willfolks",
  },
};

export function StoreBadge({ store }: StoreBadgeProps) {
  const t = useTranslations("download");
  const tSnackbar = useTranslations("snackbar");
  const locale = useLocale();
  const { showSnackbar } = useSnackbar();

  const config = STORE_CONFIG[store];
  // fallback to "en" if locale doesn't exactly match our keys
  const activeLocale = locale === "es" ? "es" : "en";
  const imageSrc = BADGES[activeLocale][store];

  const handleClick = () => {
    if (config.href) {
      window.open(config.href, "_blank", "noopener,noreferrer");
    } else {
      showSnackbar(tSnackbar("comingSoon", { store: t(config.nameKey) }));
    }
  };

  return (
    <button
      className="store-badge-image-btn"
      onClick={handleClick}
      id={`download-${store}`}
      aria-label={`Download on ${t(config.nameKey)}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={`Download on ${t(config.nameKey)}`}
        className="store-badge-img"
        style={{ height: "48px", width: "auto" }}
      />
    </button>
  );
}
