'use client';

import { LanguageIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTransition } from 'react';
import { setLocale } from '@/app/lib/i18n/actions';
import { LOCALES, LOCALE_NAMES } from '@/app/lib/i18n/config';
import { useLocale, useTranslations } from '@/app/lib/i18n/client';
import { Select } from '@/app/ui/form/element/select';

// Language dropdown. Saves the choice in a cookie (overriding the browser
// language) and re-renders the page in the selected language.
export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  return (
    <div className={clsx('text-sm text-gray-600', className)}>
      <Select
        className="w-full"
        icon={LanguageIcon}
        value={locale}
        disabled={isPending}
        onChange={(next) => startTransition(() => setLocale(next))}
        options={LOCALES.map((option) => ({
          value: option,
          label: LOCALE_NAMES[option],
        }))}
        aria-label={t('common.language')}
      />
    </div>
  );
}
