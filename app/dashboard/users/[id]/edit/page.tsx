import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/users/form';
import { fetchRoleOptions, fetchUserById } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';
import { getTranslations } from '@/app/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('metadata.editUser') };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const t = await getTranslations();
  await requirePermission('users:update');
  const { id } = await props.params;

  // A malformed id would make Postgres throw on the uuid column; treat it as not found.
  if (!z.string().uuid().safeParse(id).success) notFound();

  const [user, roles] = await Promise.all([
    fetchUserById(id),
    fetchRoleOptions(),
  ]);
  if (!user) notFound();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: t('users.title'), href: '/dashboard/users' },
          { label: t('users.edit'), href: `/dashboard/users/${id}/edit`, active: true },
        ]}
      />
      <Form user={user} roles={roles} />
    </main>
  );
}
