import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteRole } from '@/app/lib/admin-actions';
import { ConfirmDeleteButton } from '@/app/ui/confirm-delete';

export function CreateRole() {
  return (
    <Link
      href="/dashboard/roles/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Role</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateRole({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/roles/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <span className="sr-only">Edit</span>
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteRole({
  id,
  name,
  disabledReason,
}: {
  id: string;
  name: string;
  disabledReason?: string;
}) {
  return (
    <ConfirmDeleteButton
      action={deleteRole.bind(null, id)}
      title="Delete role?"
      description={`The ${name} role will be permanently deleted. This can't be undone.`}
      disabledReason={disabledReason}
    />
  );
}
