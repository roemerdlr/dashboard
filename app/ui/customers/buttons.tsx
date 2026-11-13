import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteCustomer } from '@/app/lib/actions';
import { getTranslations } from '@/app/lib/i18n/server';

export async function CreateCustomer() {
  const t = await getTranslations();
  return (
    <Link
      href="/dashboard/customers/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">{t('customers.create')}</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export async function UpdateCustomer({ id }: { id: string }) {
  const t = await getTranslations();
  return (
    <Link
      href={`/dashboard/customers/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <span className="sr-only">{t('common.edit')}</span>
      <PencilIcon className="w-5" />
    </Link>
  );
}

export async function DeleteCustomer({
  id,
  hasInvoices,
}: {
  id: string;
  hasInvoices: boolean;
}) {
  const t = await getTranslations();
  const deleteCustomerWithId = deleteCustomer.bind(null, id);
  return (
    <form action={deleteCustomerWithId}>
      <button
        type="submit"
        disabled={hasInvoices}
        title={
          hasInvoices ? t('customers.deleteHasInvoices') : t('common.delete')
        }
        className="rounded-md border p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <span className="sr-only">{t('common.delete')}</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}
