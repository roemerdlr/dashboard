import { Metadata } from 'next';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/users/form';
import { fetchRoleOptions } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.createUser') };
}

export default async function Page() {
  const t = await getTranslations();
  await requirePermission('users:create');
  const roles = await fetchRoleOptions();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('users.title'), href: '/dashboard/users' },
          { label: t('users.create'), href: '/dashboard/users/create', active: true },
        ]}
      />
      <Form roles={roles} />
    </main>
  );
}
