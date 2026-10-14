import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/site";

const DEFAULT_LOCALE: Locale = "en";

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/** First supported language in the Accept-Language header, in the visitor's order. */
function fromAcceptLanguage(header: string): Locale | undefined {
  for (const part of header.split(",")) {
    const code = part.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (isLocale(code)) return code;
  }
  return undefined;
}

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : (fromAcceptLanguage((await headers()).get("accept-language") ?? "") ?? DEFAULT_LOCALE);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
