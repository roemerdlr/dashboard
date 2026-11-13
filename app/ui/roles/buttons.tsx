import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteRole } from '@/app/lib/admin-actions';
import { ConfirmDeleteButton } from '@/app/ui/confirm-delete';
import { getTranslations } from '@/app/lib/i18n/server';

export async function CreateRole() {
  const t = await getTranslations();
  return (
    <Link
      href="/dashboard/roles/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      aria-label={t('roles.create')}
    >
      <span className="hidden md:block">{t('roles.create')}</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export async function UpdateRole({ id, name }: { id: string; name: string }) {
  const t = await getTranslations();
  const label = t('roles.editLabel', { name });
  return (
    <Link
      href={`/dashboard/roles/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
      aria-label={label}
      title={label}
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export async function DeleteRole({
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
      action={deleteRole.bind(null, id)}
      label={t('roles.deleteLabel', { name })}
      title={t('roles.deleteTitle')}
      description={t('roles.deleteDescription', { name })}
      disabledReason={disabledReason}
    />
  );
}
