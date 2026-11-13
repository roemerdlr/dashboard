'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, isLocale } from '@/app/lib/i18n/config';

// Called by the language dropdown. Changing a cookie in a Server Action
// makes Next.js re-render the current page, now in the new language.
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}
