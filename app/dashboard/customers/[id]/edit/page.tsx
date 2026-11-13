import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/customers/form';
import { fetchCustomerById } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.editCustomer') };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const t = await getTranslations();
  await requirePermission('customers:update');
  const { id } = await props.params;

  // A malformed id would make Postgres throw on the uuid column; treat it as not found.
  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const customer = await fetchCustomerById(id);
  if (!customer) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('customers.title'), href: '/dashboard/customers' },
          {
            label: t('customers.edit'),
            href: `/dashboard/customers/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form customer={customer} />
    </main>
  );
}
