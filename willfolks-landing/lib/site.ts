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
    handle: "WillFolks-App",
    href: "https://github.com/WillFolks-App",
  },
  { id: "x", label: "X", handle: null, href: null },
  { id: "instagram", label: "Instagram", handle: null, href: null },
  { id: "facebook", label: "Facebook", handle: null, href: null },
  { id: "linkedin", label: "LinkedIn", handle: null, href: null },
  { id: "discord", label: "Discord", handle: null, href: null },
];

export const STORE_LINKS = {
  googlePlay: null,
  appStore: null,
  github: "https://github.com/WillFolks-App",
} as const;

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "NEXT_LOCALE";
