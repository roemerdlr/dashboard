// Supported languages. The active one is chosen per request (see server.ts):
// 1. the NEXT_LOCALE cookie, set by the language dropdown;
// 2. otherwise the browser's Accept-Language header;
// 3. otherwise DEFAULT_LOCALE.
export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

// Shown in the language dropdown, each in its own language.
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

// BCP 47 tags for Intl formatting (dates, plural rules).
export const INTL_LOCALES: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

// Picks the best supported locale from an Accept-Language header,
// e.g. "es-PE,es;q=0.9,en;q=0.8" -> "es".
export function matchLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferences = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((pref) => pref.tag && !Number.isNaN(pref.q) && pref.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferences) {
    const language = tag.split('-')[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}
