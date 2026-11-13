'use client';

import { LanguageIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTransition } from 'react';
import { setLocale } from '@/app/lib/i18n/actions';
import { LOCALES, LOCALE_NAMES } from '@/app/lib/i18n/config';
import { useLocale, useTranslations } from '@/app/lib/i18n/client';

// Language dropdown. Saves the choice in a cookie (overriding the browser
// language) and re-renders the page in the selected language.
export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={clsx(
        'relative flex items-center gap-2 text-sm text-gray-600',
        className,
      )}
    >
      <LanguageIcon className="pointer-events-none absolute left-3 h-5 w-5 text-gray-500" />
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={locale}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => setLocale(next));
        }}
        className="w-full cursor-pointer rounded-md border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm disabled:opacity-60"
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {LOCALE_NAMES[option]}
          </option>
        ))}
      </select>
    </label>
  );
}
