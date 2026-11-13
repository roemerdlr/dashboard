import clsx from 'clsx';
import { getTranslations } from '@/app/lib/i18n/server';

export async function RoleBadge({ name }: { name: string | null }) {
  const t = await getTranslations();
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
        name ? 'bg-gray-100 text-gray-700' : 'bg-yellow-50 text-yellow-800',
      )}
    >
      {name ?? t('roles.noRole')}
    </span>
  );
}
