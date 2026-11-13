import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/roles/form';
import { fetchRoleById } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.editRole') };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const t = await getTranslations();
  await requirePermission('roles:update');
  const { id } = await props.params;

  // A malformed id would make Postgres throw on the uuid column; treat it as not found.
  if (!z.string().uuid().safeParse(id).success) notFound();

  const role = await fetchRoleById(id);
  if (!role) notFound();
  // The built-in Admin role always has every permission and can't be edited.
  if (role.is_system) redirect('/dashboard/roles');

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('roles.title'), href: '/dashboard/roles' },
          { label: t('roles.edit'), href: `/dashboard/roles/${id}/edit`, active: true },
        ]}
      />
      <Form role={role} />
    </main>
  );
}
