import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteUser } from '@/app/lib/admin-actions';
import { ConfirmDeleteButton } from '@/app/ui/confirm-delete';
import { getTranslations } from '@/app/lib/i18n/server';

export async function CreateUser() {
  const t = await getTranslations();
  return (
    <Link
      href="/dashboard/users/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label={t('users.create')}
    >
      <span className="hidden md:block">{t('users.create')}</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export async function UpdateUser({ id, name }: { id: string; name: string }) {
  const t = await getTranslations();
  const label = t('users.editLabel', { name });
  return (
    <Link
      href={`/dashboard/users/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
      aria-label={label}
      title={label}
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export async function DeleteUser({
  id,
  name,
  disabledReason,
}: {
  id: string;
  name: string;
  disabledReason?: string;
}) {
  const t = await getTranslations();
  return (
    <ConfirmDeleteButton
      action={deleteUser.bind(null, id)}
      label={t('users.deleteLabel', { name })}
      title={t('users.deleteTitle')}
      description={t('users.deleteDescription', { name })}
      disabledReason={disabledReason}
    />
  );
}
