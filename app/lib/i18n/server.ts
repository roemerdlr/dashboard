import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  matchLocale,
  type Locale,
} from '@/app/lib/i18n/config';
import { createTranslator } from '@/app/lib/i18n/translator';
import en, { type Dictionary } from '@/app/lib/i18n/dictionaries/en';
import es from '@/app/lib/i18n/dictionaries/es';

const dictionaries: Record<Locale, Dictionary> = { en, es };

// The language for this request: the dropdown's cookie wins, then the
// browser's Accept-Language header. `cache` reads them once per request.
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
  return matchLocale((await headers()).get('accept-language')) ?? DEFAULT_LOCALE;
});

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

// For Server Components, Server Actions and generateMetadata:
//   const t = await getTranslations();
//   t('invoices.title')
export async function getTranslations() {
  const locale = await getLocale();
  return createTranslator(getDictionary(locale), locale);
}
