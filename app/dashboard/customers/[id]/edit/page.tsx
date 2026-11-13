import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/customers/form';
import { fetchCustomerById } from '@/app/lib/data';

export const metadata: Metadata = {
  title: 'Edit Customer',
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
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
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Edit Customer',
            href: `/dashboard/customers/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form customer={customer} />
    </main>
  );
}
