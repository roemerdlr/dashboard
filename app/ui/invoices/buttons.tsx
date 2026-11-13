import { PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deleteInvoice } from '@/app/lib/actions';
import { ConfirmDeleteButton } from '@/app/ui/confirm-delete';
import { getTranslations } from '@/app/lib/i18n/server';

export async function CreateInvoice() {
  const t = await getTranslations();
  return (
    <Link
      href="/dashboard/invoices/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">{t('invoices.create')}</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export async function UpdateInvoice({ id }: { id: string }) {
  const t = await getTranslations();
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <span className="sr-only">{t('common.edit')}</span>
      <PencilIcon className="w-5" />
    </Link>
  );
}

export async function DeleteInvoice({
  id,
  customerName,
  amount,
}: {
  id: string;
  customerName: string;
  amount: string;
}) {
  const t = await getTranslations();
  const deleteInvoiceWithId = deleteInvoice.bind(null, id);
  return (
    <ConfirmDeleteButton
      action={deleteInvoiceWithId}
      title={t('invoices.deleteTitle')}
      description={t('invoices.deleteDescription', {
        amount,
        customer: customerName,
      })}
    />
  );
}
