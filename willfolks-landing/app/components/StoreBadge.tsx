"use client";

import { useTranslations } from "next-intl";
import { useSnackbar } from "./SnackbarProvider";
import { FaGooglePlay, FaApple, FaGithub } from "react-icons/fa";

interface StoreBadgeProps {
  store: "googlePlay" | "appStore" | "github";
}

const STORE_CONFIG = {
  googlePlay: {
    icon: FaGooglePlay,
    labelKey: "getItOn" as const,
    label: "GET IT ON",
    nameKey: "googlePlay" as const,
    href: null,
  },
  appStore: {
    icon: FaApple,
    labelKey: "downloadOnThe" as const,
    label: "Download on the",
    nameKey: "appStore" as const,
    href: null,
  },
  github: {
    icon: FaGithub,
    labelKey: "getItOn" as const,
    label: "GET IT ON",
    nameKey: "github" as const,
    href: "https://github.com/willfolks",
  },
};

export function StoreBadge({ store }: StoreBadgeProps) {
  const t = useTranslations("download");
  const tSnackbar = useTranslations("snackbar");
  const { showSnackbar } = useSnackbar();
  const config = STORE_CONFIG[store];
  const Icon = config.icon;

  const handleClick = () => {
    if (config.href) {
      window.open(config.href, "_blank", "noopener,noreferrer");
    } else {
      showSnackbar(tSnackbar("comingSoon", { store: t(config.nameKey) }));
    }
  };

  const label = store === "github" ? "GET IT ON" : t(config.labelKey);

  return (
    <button
      className="store-badge"
      onClick={handleClick}
      id={`download-${store}`}
      aria-label={`${label} ${t(config.nameKey)}`}
    >
      <span className="store-badge__icon">
        <Icon />
      </span>
      <span className="store-badge__text">
        <span className="store-badge__label">{label}</span>
        <span className="store-badge__name">{t(config.nameKey)}</span>
      </span>
    </button>
  );
}
