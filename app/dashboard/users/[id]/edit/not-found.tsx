import Link from 'next/link';
import { FaceFrownIcon } from '@heroicons/react/24/outline';
import { getTranslations } from '@/app/lib/i18n/server';

export default async function NotFound() {
    const t = await getTranslations();
    return (
        <main className="flex h-full flex-col items-center justify-center gap-2">
            <FaceFrownIcon className="w-10 text-gray-400" />
            <h2 className="text-xl font-semibold">{t('common.notFoundTitle')}</h2>
            <p>{t('users.notFound')}</p>
            <Link
                href="/dashboard/users"
                className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
            >
                {t('common.goBack')}
            </Link>
        </main>
    );
}
