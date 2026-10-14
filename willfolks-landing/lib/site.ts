/**
 * Single source of truth for outbound links.
 * A `null` href means the channel is not live yet: the UI shows it as
 * "coming soon" instead of linking to a profile that may not be ours.
 */
export const SITE = {
  name: "WillFolks",
  contactEmail: "support@willfolks.com",
  copyrightHolder: "SaulChoque",
  year: 2026,
  legalUpdated: "2026-10-06",
} as const;

export type SocialId =
  | "github"
  | "x"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "discord";

export interface SocialLink {
  id: SocialId;
  label: string;
  /** Only set for live channels, so we never print a handle we do not own. */
  handle: string | null;
  href: string | null;
}

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    handle: "WillFolks-monorepo",
    href: "https://github.com/SaulChoque/WillFolks-monorepo",
  },
  { id: "x", label: "X", handle: "@WillFolksApp", href: "https://x.com/WillFolksApp" },
  { id: "instagram", label: "Instagram", handle: null, href: null },
  { id: "facebook", label: "Facebook", handle: null, href: null },
  { id: "linkedin", label: "LinkedIn", handle: null, href: null },
  { id: "discord", label: "Discord", handle: null, href: null },
];

export const REPO_URL = "https://github.com/SaulChoque/WillFolks-monorepo";
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
export const API_URL = "https://api.willfolks.bamp.lat";

export const STORE_LINKS = {
  googlePlay: null,
  appStore: null,
  /** The Android build (testnet) is published as a GitHub release. */
  github: RELEASES_URL,
} as const;

/** What the live product runs on. Testnet only: no real money moves. */
export const CHAIN = {
  name: "Monad testnet",
  id: 10143,
  explorer: "https://testnet.monadscan.com",
  escrow: "0x3422820Ef9FBC8e0206E4CBcB6369dBd14BE18c4",
  usdc: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
} as const;

export type VideoId = "demo" | "pitch" | "promo";

/**
 * Hackathon videos. `src` takes a YouTube link or a direct video file; while it
 * is `null` the page shows the video as "in post-production".
 */
export const VIDEOS: Record<VideoId, { src: string | null }> = {
  demo: { src: null },
  pitch: { src: null },
  promo: { src: null },
};

/** Pages that back the hackathon submission, in the order they are listed. */
export const PROJECT_PAGES = ["live", "demo", "pitch", "promo", "gtm"] as const;
export type ProjectPage = (typeof PROJECT_PAGES)[number];

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "NEXT_LOCALE";
