"use server";

import { cookies } from "next/headers";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/site";

/** Persist the visitor's language. Setting a cookie here re-renders the route. */
export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
