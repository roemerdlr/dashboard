'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Locale } from '@/app/lib/i18n/config';
import type { Dictionary } from '@/app/lib/i18n/dictionaries/en';
import { createTranslator, type Translator } from '@/app/lib/i18n/translator';

const I18nContext = createContext<{ locale: Locale; t: Translator } | null>(
  null,
);

// Set up once in the root layout with the request's language and dictionary,
// so Client Components can translate without another server round trip.
export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, t: createTranslator(dictionary, locale) }),
    [locale, dictionary],
  );
  return <I18nContext value={value}>{children}</I18nContext>;
}

function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslations must be used inside I18nProvider');
  return context;
}

// For Client Components: const t = useTranslations(); t('common.cancel')
export function useTranslations() {
  return useI18n().t;
}

export function useLocale() {
  return useI18n().locale;
}
