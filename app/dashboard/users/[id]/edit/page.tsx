import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/users/form';
import { fetchRoleOptions, fetchUserById } from '@/app/lib/data';
import { requirePermission } from '@/app/lib/auth-guard';

export const metadata: Metadata = {
  title: 'Edit User',
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
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
          { label: 'Users', href: '/dashboard/users' },
          { label: 'Edit User', href: `/dashboard/users/${id}/edit`, active: true },
        ]}
      />
      <Form user={user} roles={roles} />
    </main>
  );
}
