'use client';
 
import { useEffect } from 'react';
import { useTranslations } from '@/app/lib/i18n/client';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);
 
  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center">{t('common.somethingWentWrong')}</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={
          // Attempt to recover by trying to re-render the customers route
          () => reset()
        }
      >
        {t('common.tryAgain')}
      </button>
    </main>
  );
}
