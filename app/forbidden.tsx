import Link from 'next/link';
import { NoSymbolIcon } from '@heroicons/react/24/outline';
import { signOut } from '@/auth';
import { getTranslations } from '@/app/lib/i18n/server';

// Rendered (with a 403 status) when forbidden() is called, i.e. when the
// signed-in user's role lacks the permission a page or action requires.
export default async function Forbidden() {
  const t = await getTranslations();
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <NoSymbolIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">{t('forbidden.title')}</h2>
      <p className="text-gray-600">
        {t('forbidden.message')}
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        >
          {t('forbidden.goToDashboard')}
        </Link>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200">
            {t('forbidden.switchUser')}
          </button>
        </form>
      </div>
    </main>
  );
}
