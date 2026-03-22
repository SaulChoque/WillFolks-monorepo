import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import en from './locales/en.json';
import es from './locales/es.json';

const i18n = new I18n({ en, es });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function getDeviceLanguage() {
  const primary = getLocales()[0]?.languageCode?.toLowerCase();
  return primary === 'es' ? 'es' : 'en';
}

export function getDeviceLocaleTag() {
  return getLocales()[0]?.languageTag ?? 'en-US';
}

export function setI18nLocale(locale?: string) {
  i18n.locale = locale ?? getDeviceLanguage();
}

setI18nLocale();

export { i18n };

export const t = i18n.t.bind(i18n);
