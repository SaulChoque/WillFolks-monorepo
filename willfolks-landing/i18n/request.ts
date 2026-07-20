import { getRequestConfig } from 'next-intl/server';
import { headers, cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Detect locale from Accept-Language header
  const preferredLocale = acceptLanguage.split(',')[0]?.split('-')[0]?.trim();
  const locale = localeCookie || (preferredLocale === 'es' ? 'es' : 'en');

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
