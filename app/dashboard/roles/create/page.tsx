import { Metadata } from 'next';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/roles/form';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.createRole') };
}

export default async function Page() {
  const t = await getTranslations();
  await requirePermission('roles:create');

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('roles.title'), href: '/dashboard/roles' },
          { label: t('roles.create'), href: '/dashboard/roles/create', active: true },
        ]}
      />
      <Form />
    </main>
  );
}
