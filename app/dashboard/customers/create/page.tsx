import { Metadata } from 'next';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/customers/form';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.createCustomer') };
}

export default async function Page() {
  const t = await getTranslations();
  await requirePermission('customers:create');
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('customers.title'), href: '/dashboard/customers' },
          {
            label: t('customers.create'),
            href: '/dashboard/customers/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
