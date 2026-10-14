import { i18n, t } from "@/i18n";
import { API_URL, ApiError } from "@/lib/api";

/** A message fit for the screen: translated when the API gave a known code. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code) {
      const key = `errors.${error.code}`;
      const translated = t(key, { ...error.data, url: API_URL, defaultValue: "" });
      if (translated && !translated.startsWith("[missing")) return translated;
    }
    if (error.code?.startsWith("TILCAI_")) return t("errors.SERVICE_UNAVAILABLE");
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return i18n.t("errors.unknown");
}
